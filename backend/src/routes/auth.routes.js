// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Rota para registrar um novo usuário
// POST http://localhost:3001/api/v1/auth/register
router.post('/register', authController.register);

// Rota para logar um usuário
// POST http://localhost:3001/api/v1/auth/login
router.post('/login', authController.login);

// Rota para solicitar a redefinição de senha
// POST http://localhost:3001/api/v1/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// Rota para efetivamente redefinir a senha com o token
// POST http://localhost:3001/api/v1/auth/reset-password
router.post('/reset-password', authController.resetPassword);

// Rota para renovar o access token usando o refresh token
// POST http://localhost:3001/api/v1/auth/refresh
router.post('/refresh', authController.refresh);

// Rota para fazer logout e invalidar o refresh token
// POST http://localhost:3001/api/v1/auth/logout
router.post('/logout', authController.logout);


module.exports = router;