// backend/src/controllers/public.controller.js
const publicService = require('../services/public.service');
const rankingService = require('../services/ranking.service');

exports.getHomepageData = async (req, res) => {
    try {
        const data = await publicService.getHomepageData();
        res.status(200).json(data);
    } catch (error) {
        console.error('Erro ao buscar dados da homepage:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

exports.getNewsById = async (req, res) => {
    try {
        const article = await publicService.getNewsById(req.params.id);
        res.status(200).json(article);
    } catch (error) {
        if (error.message.includes('não encontrada')) {
            return res.status(404).json({ message: error.message });
        }
        console.error('Erro ao buscar notícia por ID:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

exports.getRanking = async (req, res) => {
    try {
        const { searchNick } = req.query;
        const rankingData = await publicService.getRanking(searchNick);
        res.status(200).json(rankingData);
    } catch (error) {
        console.error('Erro ao buscar ranking:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

exports.getShopItems = async (req, res) => {
    try {
        const shopData = await publicService.getShopItems(req.query);
        res.status(200).json(shopData);
    } catch (error) {
        console.error('Erro ao buscar itens da loja:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// Função para acionar a atualização do ranking
exports.handleRankingUpdate = async (req, res) => {
    try {
        const result = await rankingService.updateAllRankings();
        res.status(200).json(result);
    } catch (error) {
        console.error('ERRO DURANTE A ATUALIZAÇÃO DO RANKING.', error);
        res.status(500).json({ message: 'Ocorreu um erro inesperado ao atualizar o ranking.' });
    }
};

// --- FUNÇÃO DE COTAÇÕES ATUALIZADA ---
exports.getRates = async (req, res) => {
    try {
        const rates = await publicService.getAllRates();
        res.status(200).json(rates);
    } catch (error) {
        console.error('Erro ao buscar cotações:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar cotações.' });
    }
};