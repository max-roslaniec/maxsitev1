// backend/src/routes/gcash.routes.js
const express = require('express');
const router = express.Router();
const gcashController = require('../controllers/gcash.controller');
const { protect } = require('../middlewares/auth.middleware');

// POST /api/v1/gcash/verify-purchase
// Esta rota é protegida. Apenas usuários logados podem acessá-la.
// O middleware 'protect' garante que teremos o 'req.user.id' disponível.
router.post('/verify-purchase', protect, gcashController.verifyPurchase);

module.exports = router;