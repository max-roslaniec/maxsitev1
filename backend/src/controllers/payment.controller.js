// backend/src/controllers/payment.controller.js
const paymentService = require('../services/payment.service');

/**
 * Controlador para criar um pedido de pagamento no Mercado Pago.
 */
exports.createMercadoPagoOrder = async (req, res) => {
    try {
        const { cashAmount } = req.body;
        const userId = req.user.id; // Vem do middleware 'protect'

        if (!cashAmount || isNaN(cashAmount) || Number(cashAmount) <= 0) {
            return res.status(400).json({ message: 'A quantidade de CASH deve ser um número positivo.' });
        }

        const preference = await paymentService.createMercadoPagoPreference(userId, Number(cashAmount));

        res.status(201).json({ 
            preferenceId: preference.id,
            init_point: preference.init_point 
        });

    } catch (error) {
        console.error("Erro ao criar preferência do Mercado Pago:", error);
        res.status(error.status || 500).json({ message: error.message || 'Falha ao criar o pedido de pagamento.' });
    }
};

/**
 * Controlador que recebe e processa o webhook do Mercado Pago.
 */
exports.handleMercadoPagoWebhook = async (req, res) => {
    try {
        const notification = req.body;
        
        // Passa a notificação para o serviço processar em segundo plano
        // Não precisamos esperar a conclusão para responder ao Mercado Pago.
        paymentService.handleMercadoPagoNotification(notification)
            .catch(err => {
                // Mesmo que o processamento falhe, não enviamos um erro de volta para o MP,
                // pois ele pode parar de enviar notificações. Apenas registamos o erro.
                console.error('[CONTROLLER] Erro no processamento do webhook:', err.message);
            });

        // Responde IMEDIATAMENTE ao Mercado Pago com status 200 OK.
        // Isso é obrigatório. Se demorarmos para responder, o MP considera que a notificação falhou.
        res.status(200).send('Notificação recebida.');

    } catch (error) {
        console.error("Erro inesperado no controlador do webhook:", error);
        res.status(500).send('Erro interno no servidor.');
    }
};