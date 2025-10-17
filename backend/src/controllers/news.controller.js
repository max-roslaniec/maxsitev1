// src/controllers/news.controller.js
const newsService = require('../services/news.service');

exports.createNews = async (req, res) => {
    try {
        const news = await newsService.createNews(req.body);
        res.status(201).json(news);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar notícia.', error: error.message });
    }
};

/**
 * FUNÇÃO ATUALIZADA PARA LIDAR COM BUSCA E PAGINAÇÃO
 * Lista todas as notícias para o painel de admin.
 */
exports.getAllNews = async (req, res) => {
    try {
        // Extrai os parâmetros da URL, com valores padrão
        const page = parseInt(req.query.page || 1, 10);
        const limit = parseInt(req.query.limit || 20, 10);
        const searchQuery = req.query.search || '';

        // Passa os parâmetros para o serviço
        const newsData = await newsService.getAllNews({ page, limit, searchQuery });
        res.status(200).json(newsData);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar notícias.', error: error.message });
    }
};

exports.getNewsById = async (req, res) => {
    try {
        const article = await newsService.getNewsById(req.params.id);
        res.status(200).json(article);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

exports.updateNews = async (req, res) => {
    try {
        const updatedArticle = await newsService.updateNews(req.params.id, req.body);
        res.status(200).json(updatedArticle);
    } catch (error) {
        if (error.message.includes('encontrada')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Erro ao atualizar notícia.', error: error.message });
    }
};

exports.deleteNews = async (req, res) => {
    try {
        await newsService.deleteNews(req.params.id);
        res.status(204).send(); // 204 No Content - sucesso, sem corpo de resposta
    } catch (error) {
        if (error.message.includes('encontrada')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Erro ao deletar notícia.', error: error.message });
    }
};