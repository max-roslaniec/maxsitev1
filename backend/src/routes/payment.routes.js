// backend/src/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middlewares/auth.middleware');

// Rota para o frontend criar um pedido de pagamento.
// É protegida, pois apenas um usuário logado pode criar um pedido para si mesmo.
router.post('/create-mercado-pago-order', protect, paymentController.createMercadoPagoOrder);

// Rota para o servidor do Mercado Pago nos enviar a confirmação (webhook).
// Esta rota NÃO PODE ser protegida, pois a requisição vem de um servidor externo.
router.post('/mercado-pago-webhook', paymentController.handleMercadoPagoWebhook);

module.exports = router;