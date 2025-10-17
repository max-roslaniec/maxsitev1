// backend/src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Controladores ---
const newsController = require('../controllers/news.controller');
const userController = require('../controllers/user.controller');
const shopController = require('../controllers/shop.controller');
const rankingController = require('../controllers/ranking.controller');
const inventoryController = require('../controllers/inventory.controller');

// --- Novas Rotas ---
const settingsRoutes = require('./settings.routes');
const swapAdminRoutes = require('./swap.admin.routes');
const guildAdminRoutes = require('./guild.admin.routes'); // <-- 1. IMPORTE AS NOVAS ROTAS

// --- Middlewares de Segurança ---
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');

// --- Configuração do Multer para avatares da loja ---
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/images/avatars'));
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const uploadAvatar = multer({ storage: avatarStorage });

// --- Configuração do Multer para imagens de recompensas Gacha ---
const gachaRewardStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      console.log('[Multer]: gachaRewardStorage destination function called.');
      const uploadPath = path.join(__dirname, '../../public/images/gacha_rewards');
      console.log(`[Multer]: Upload path is: ${uploadPath}`);
      try {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log('[Multer]: Directory created or already exists.');
        cb(null, uploadPath);
      } catch (error) {
        console.error('[Multer]: Error creating directory:', error);
        cb(error);
      }
    },
    filename: function (req, file, cb) {
      const filename = 'gacha-reward-' + Date.now() + path.extname(file.originalname);
      console.log(`[Multer]: Generating filename: ${filename}`);
      cb(null, filename);
    }
});
const uploadGachaReward = multer({ storage: gachaRewardStorage });


// --- Gatekeeper de Segurança ---
router.use(protect, isAdmin);

// --- ROTAS DE GERENCIAMENTO ---
router.use('/settings', settingsRoutes);
router.use('/swaps', swapAdminRoutes);
router.use('/guilds', guildAdminRoutes); // <-- 2. USE AS NOVAS ROTAS AQUI

// --- ROTAS DE NOTÍCIAS ---
router.get('/news', newsController.getAllNews);
router.post('/news', newsController.createNews);
router.get('/news/:id', newsController.getNewsById);
router.put('/news/:id', newsController.updateNews);
router.delete('/news/:id', newsController.deleteNews);

// --- ROTAS DE USUÁRIOS ---
router.get('/users', userController.listUsers);
router.get('/users/:id', userController.getUserDetails);
router.put('/users/:id', userController.updateUserDetails);
router.delete('/users/:id', userController.deleteUser);
router.get('/users/:id/inventory', inventoryController.listUserInventory);

// --- ROTAS DE INVENTÁRIO ---
router.post('/inventory/add', inventoryController.addItem);
router.delete('/inventory/:itemNo', inventoryController.deleteItem);

// --- ROTAS DA LOJA ---
router.get('/shop', shopController.listAllItems);
router.post('/shop', uploadAvatar.single('imageFile'), shopController.createItem);
router.get('/shop/:id', shopController.getItemDetails);
router.put('/shop/:id', uploadAvatar.single('imageFile'), shopController.updateItem);
router.delete('/shop/:id', shopController.deleteItem);
// Rota para upload de imagem de recompensa do gacha
router.post('/shop/upload-reward-image', uploadGachaReward.single('rewardImage'), shopController.uploadRewardImage);

// --- ROTA DE AÇÕES GLOBAIS ---
router.post('/ranking/update', rankingController.updateRankings);

module.exports = router;