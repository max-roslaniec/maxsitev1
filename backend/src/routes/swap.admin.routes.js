// backend/src/routes/swap.admin.routes.js
const express = require('express');
const router = express.Router();
const swapController = require('../controllers/swap.controller');

// Rota para o admin buscar a lista de solicitações
// GET /api/v1/admin/swaps
router.get('/', swapController.getRequests);

// Rota para o admin atualizar o status de uma solicitação
// PATCH /api/v1/admin/swaps/:id/status
router.patch('/:id/status', swapController.updateRequestStatus);

module.exports = router;