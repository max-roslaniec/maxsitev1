// backend/src/routes/public.routes.js
const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');
const { checkPageStatus } = require('../middlewares/public.middleware');

// Rotas para o site público
router.get('/homepage', publicController.getHomepageData);
router.get('/news/:id', publicController.getNewsById);
router.get('/ranking', checkPageStatus('isRankingEnabled'), publicController.getRanking);
router.get('/shop', checkPageStatus('isShopEnabled'), publicController.getShopItems);

// Rota para buscar todas as cotações públicas
router.get('/rates', publicController.getRates);

// Rota para o admin acionar a atualização do ranking
router.post('/ranking/update', publicController.handleRankingUpdate);
    
module.exports = router;