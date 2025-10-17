// backend/src/controllers/gcash.controller.js
const gcashService = require('../services/gcash.service');

exports.verifyPurchase = async (req, res) => {
    try {
        const { txid, itemId } = req.body;
        const userId = req.user.id; // Vem do token JWT do usuário logado

        if (!txid || !itemId) {
            return res.status(400).json({ message: 'O ID da transação (txid) e o ID do item (itemId) são obrigatórios.' });
        }

        const result = await gcashService.verifyAndProcessTx(txid, userId, itemId);
        
        // O serviço retornará uma mensagem de sucesso detalhada
        res.status(200).json({ message: result.message });

    } catch (error) {
        // O serviço pode lançar erros com status codes específicos (404, 409, 400, etc)
        // Se não for um erro customizado, será um erro 500 genérico.
        console.error("ERRO na verificação da compra com GCASH:", error);
        res.status(error.status || 500).json({ message: error.message || 'Ocorreu um erro inesperado no servidor.' });
    }
};