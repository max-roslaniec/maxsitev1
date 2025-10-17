// backend/src/routes/guild.admin.routes.js
const express = require('express');
const router = express.Router();
const guildController = require('../controllers/guild.controller');

// Rota para o admin buscar a lista de solicitações de criação
// GET /api/v1/admin/guilds/creation-requests
router.get('/creation-requests', guildController.listCreationRequests);

// Rota para o admin aprovar uma solicitação
// POST /api/v1/admin/guilds/creation-requests/:id/approve
router.post('/creation-requests/:id/approve', guildController.approveCreation);

// Rota para o admin reprovar uma solicitação
// POST /api/v1/admin/guilds/creation-requests/:id/reject
router.post('/creation-requests/:id/reject', guildController.rejectCreation);

module.exports = router;