// backend/src/controllers/guild.public.controller.js
const guildPublicService = require('../services/guild.public.service');

/**
 * Controlador para listar todas as guilds na página pública de diretório.
 */
exports.listPublicGuilds = async (req, res) => {
    try {
        const { page, search } = req.query;
        const guildsData = await guildPublicService.getAllPublicGuilds(page, search);
        res.status(200).json(guildsData);
    } catch (error) {
        console.error("Erro ao buscar guilds públicas:", error);
        res.status(500).json({ message: 'Não foi possível carregar a lista de guilds.' });
    }
};

/**
 * Controlador ATUALIZADO para a página de ranking de guilds, agora com busca.
 */
exports.getGuildRanking = async (req, res) => {
    try {
        // Pega o termo de busca da URL (ex: /ranking/guilds?search=NomeDaGuild)
        const { search } = req.query;
        const rankingData = await guildPublicService.getGuildRanking(search);
        res.status(200).json(rankingData);
    } catch (error) {
        console.error("Erro ao buscar ranking de guilds:", error);
        res.status(500).json({ message: 'Não foi possível carregar o ranking de guilds.' });
    }
};