// backend/src/routes/settings.routes.js
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');

// Rota para buscar as configurações atuais
// GET /api/v1/admin/settings
router.get('/', settingsController.getSettings);

// Rota para salvar as novas configurações
// POST /api/v1/admin/settings
router.post('/', settingsController.updateSettings);

module.exports = router;