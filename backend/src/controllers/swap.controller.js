// backend/src/controllers/swap.controller.js
const swapService = require('../services/swap.service');

// ====================================================================
// FUNÇÕES PARA O JOGADOR
// ====================================================================

exports.createRequest = async (req, res) => {
    try {
        const { goldAmount, solanaWallet, confirmWallet } = req.body;
        const userId = req.user.id;
        if (!goldAmount || !solanaWallet || !confirmWallet) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }
        if (solanaWallet !== confirmWallet) {
            return res.status(400).json({ message: 'Os endereços da carteira Solana não coincidem.' });
        }
        const amount = Number(goldAmount);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'A quantidade de GOLD deve ser um número positivo.' });
        }
        if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(solanaWallet)) {
            return res.status(400).json({ message: 'O endereço da carteira Solana parece ser inválido.' });
        }
        if (amount < 100000) {
            return res.status(400).json({ message: 'A quantidade mínima para troca é de 100.000 GOLD.' });
        }
        if ((amount - 100000) % 1000 !== 0) {
            return res.status(400).json({ message: 'Acima de 100.000, os valores devem ser em incrementos de 1.000 GOLD (ex: 101.000, 102.000).' });
        }
        const result = await swapService.createSwapRequest(userId, amount, solanaWallet);
        res.status(201).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Ocorreu um erro inesperado no servidor.' });
    }
};

exports.verifyAndCreateSwapRequest = async (req, res) => {
    try {
        const { txid, pixKey } = req.body;
        const userId = req.user.id;

        if (!txid || !pixKey) {
            return res.status(400).json({ message: 'O ID da transação (txid) e a chave PIX são obrigatórios.' });
        }

        if (pixKey.length < 3 || pixKey.length > 100) { // Exemplo de validação simples
            return res.status(400).json({ message: 'A chave PIX parece ser inválida.' });
        }

        const result = await swapService.verifyAndCreateGcashToBrlSwap(userId, txid, pixKey);
        res.status(201).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Ocorreu um erro inesperado no servidor.' });
    }
};


// ====================================================================
// FUNÇÕES PARA O PAINEL DE ADMIN (ATUALIZADAS)
// ====================================================================

/**
 * Controlador ATUALIZADO para listar as solicitações de SWAP com filtros.
 */
exports.getRequests = async (req, res) => {
    try {
        const { page, limit, search, status, type } = req.query; // Adicionado type
        
        const data = await swapService.getSwapRequests({
            page: parseInt(page || 1, 10),
            limit: parseInt(limit || 20, 10),
            searchQuery: search || '',
            status: status || 'Pendente',
            type: type || 'Todos' // Passa o tipo para o serviço
        });
        res.status(200).json(data);
    } catch (error) {
        console.error("Erro ao buscar solicitações de SWAP:", error);
        res.status(500).json({ message: 'Erro ao buscar solicitações de SWAP.' });
    }
};

/**
 * Controlador para atualizar o status de uma solicitação de SWAP.
 */
exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: 'O novo status é obrigatório.' });
        }
        const result = await swapService.updateSwapRequestStatus(id, status);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Erro ao atualizar solicitação de SWAP.' });
    }
};