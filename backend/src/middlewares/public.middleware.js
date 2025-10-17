// backend/src/middlewares/public.middleware.js
const settingsService = require('../services/settings.service');

exports.checkPageStatus = (pageKey) => {
    return async (req, res, next) => {
        try {
            const settings = await settingsService.getSettings();
            if (settings[pageKey] && settings[pageKey] === 'true') {
                next();
            } else {
                res.status(403).json({ message: 'Esta página está desativada.' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Erro ao verificar o status da página.' });
        }
    };
};
