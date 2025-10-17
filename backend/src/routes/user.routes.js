// src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');

// GET /api/v1/user/me
// Rota protegida que retorna os dados do usuário atualmente logado
router.get('/me', protect, userController.getCurrentUserData);



module.exports = router;