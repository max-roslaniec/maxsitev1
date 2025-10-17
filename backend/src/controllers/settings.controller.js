// backend/src/controllers/settings.controller.js
const settingsService = require('../services/settings.service');

/**
 * Controlador para buscar as configurações.
 * Ele chama o serviço e envia as configurações como um JSON.
 */
exports.getSettings = async (req, res) => {
    try {
        const settings = await settingsService.getSettings();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar as configurações do servidor.' });
    }
};

/**
 * Controlador para atualizar as configurações.
 * Ele recebe os novos valores no corpo da requisição e os passa para o serviço.
 */
exports.updateSettings = async (req, res) => {
    try {
        const result = await settingsService.updateSettings(req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar as configurações do servidor.' });
    }
};