// src/routes/shop.routes.js
const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop.controller');
const { protect } = require('../middlewares/auth.middleware');

// POST http://localhost:3001/api/v1/shop/buy
// A rota é protegida pelo middleware 'protect'. Só passa se o token for válido.
router.post('/buy', protect, shopController.purchaseItem);

// Rota para comprar um item Gacha
router.post('/buy-gacha', protect, shopController.purchaseGachaItem);

module.exports = router;