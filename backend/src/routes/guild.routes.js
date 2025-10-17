// backend/src/routes/guild.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const guildController = require('../controllers/guild.controller');
const guildPublicController = require('../controllers/guild.public.controller');
const { protect } = require('../middlewares/auth.middleware');
const { checkPageStatus } = require('../middlewares/public.middleware');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/images/guilds'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


// ====================================================================
// --- ROTAS PÚBLICAS ---
// ====================================================================

// Rota para listar todas as guilds (página de diretório)
router.get('/', checkPageStatus('isGuildDirectoryEnabled'), guildPublicController.listPublicGuilds);

// Rota para o Ranking de Guilds
router.get('/ranking', checkPageStatus('isGuildRankingEnabled'), guildPublicController.getGuildRanking);


// ====================================================================
// --- ROTAS DE JOGADOR (EXIGEM LOGIN) ---
// ====================================================================

// Rota para Solicitar a Criação de uma Guild
router.post('/create-request', protect, upload.single('guild_image'), guildController.createRequest);

// Rota para Pedir para Participar de uma Guild
router.post('/:guildId/join-request', protect, guildController.createJoinRequest);

// Rota para Sair da Guild atual
router.post('/leave', protect, guildController.leaveGuild);


// ====================================================================
// --- ROTAS DE LÍDER/MODERADOR DE GUILD (EXIGEM LOGIN) ---
// ====================================================================

// Rota para buscar os dados para a página de gerenciamento
router.get('/manage', protect, guildController.getManagementData);

// Rota para aceitar/rejeitar um pedido de entrada
router.post('/manage/requests/:requestId', protect, guildController.processJoinRequest);

// Rota para atualizar descrição e discord
router.patch('/manage/:guildId/info', protect, guildController.updateGuildInfo);

// Rota para alterar o nome da guilda
router.patch('/manage/:guildId/change-name', protect, guildController.changeGuildName);

// Rota para alterar a imagem da guilda
router.patch('/manage/:guildId/change-image', protect, upload.single('guild_image'), guildController.changeGuildImage);

// Rota para expulsar um membro
router.post('/manage/members/:memberId/kick', protect, guildController.kickGuildMember);

// Rota para alterar o cargo de um membro
router.patch('/manage/:guildId/members/:memberId/role', protect, guildController.updateMemberRole);

// Rota para o líder deletar a guilda
router.delete('/:guildId', protect, guildController.deleteGuild);

module.exports = router;