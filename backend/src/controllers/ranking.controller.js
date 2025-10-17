// backend/src/controllers/ranking.controller.js
const rankingService = require('../services/ranking.service');

exports.updateRankings = async (req, res) => {
    try {
        const result = await rankingService.updateAllRankings();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};