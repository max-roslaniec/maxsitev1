// backend/src/routes/swap.routes.js
const express = require('express');
const router = express.Router();
const swapController = require('../controllers/swap.controller');
const { protect } = require('../middlewares/auth.middleware');

// Rota para um jogador criar uma nova solicitação de SWAP (GOLD -> GCASH).
// É protegida, garantindo que apenas usuários logados possam fazer solicitações.
// POST /api/v1/swap/request
router.post('/request', protect, swapController.createRequest);

// Rota para um jogador criar uma nova solicitação de SWAP de GCASH para BRL, verificada na blockchain.
// POST /api/v1/swap/verify-gcash-swap
router.post('/verify-gcash-swap', protect, swapController.verifyAndCreateSwapRequest);

module.exports = router;