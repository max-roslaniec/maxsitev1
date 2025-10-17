// backend/src/controllers/guild.controller.js
const guildService = require('../services/guild.service');

// ====================================================================
// FUNÇÕES PARA O JOGADOR
// ====================================================================

exports.createRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { guild_name, guild_description, discord_url } = req.body;

        if (!guild_name || !guild_description) {
            return res.status(400).json({ message: 'O nome e a descrição da guilda são obrigatórios.' });
        }
        if (guild_name.length < 3 || guild_name.length > 8) {
            return res.status(400).json({ message: 'O nome da guilda deve ter entre 3 e 8 caracteres.' });
        }
        if (guild_description.length > 100) {
            return res.status(400).json({ message: 'A descrição da guilda deve ter no máximo 100 caracteres.' });
        }

        const guild_image_url = req.file ? req.file.filename : null;

        const guildData = {
            guild_name,
            guild_description,
            discord_url,
            guild_image_url
        };

        const result = await guildService.createGuildRequest(userId, guildData);

        res.status(201).json(result);

    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Ocorreu um erro inesperado no servidor.' });
    }
};

exports.createJoinRequest = async (req, res) => {
    try {
        const { guildId } = req.params;
        const userId = req.user.id;
        const result = await guildService.createJoinRequest(userId, guildId);
        res.status(201).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Erro ao enviar pedido para entrar na guilda.' });
    }
};

exports.leaveGuild = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await guildService.leaveGuild(userId);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Erro ao sair da guilda.' });
    }
};

// ====================================================================
// FUNÇÕES PARA O LÍDER E MODERADOR DA GUILD
// ====================================================================

exports.getManagementData = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await guildService.getGuildManagementData(userId);
        res.status(200).json(data);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Erro ao buscar dados de gerenciamento da guilda.' });
    }
};

exports.processJoinRequest = async (req, res) => {
    try {
        const editorId = req.user.id;
        const { requestId } = req.params;
        const { action } = req.body;

        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Ação inválida.' });
        }

        const result = await guildService.processJoinRequest(editorId, requestId, action);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Erro ao processar pedido de entrada.' });
    }
};

exports.updateGuildInfo = async (req, res) => {
    try {
        const editorId = req.user.id;
        const { guildId } = req.params;
        const result = await guildService.updateGuildInfo(editorId, guildId, req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Erro ao atualizar informações da guilda.' });
    }
};

exports.kickGuildMember = async (req, res) => {
    try {
        const editorId = req.user.id;
        const { memberId } = req.params; // ID do membro a ser expulso
        const result = await guildService.kickGuildMember(editorId, memberId);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Erro ao expulsar membro.' });
    }
};

exports.updateMemberRole = async (req, res) => {
    try {
        const leaderId = req.user.id;
        const { guildId, memberId } = req.params;
        const { newRole } = req.body;

        if (!newRole) {
            return res.status(400).json({ message: 'O novo cargo é obrigatório.' });
        }
        
        const result = await guildService.updateMemberRole(leaderId, guildId, memberId, newRole);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Erro ao alterar o cargo do membro.' });
    }
};

exports.changeGuildName = async (req, res) => {
    try {
        const editorId = req.user.id;
        const { guildId } = req.params;
        const { newName } = req.body;

        if (!newName || newName.length < 3 || newName.length > 8) {
            return res.status(400).json({ message: 'O novo nome da guilda deve ter entre 3 e 8 caracteres.' });
        }

        const result = await guildService.changeGuildName(editorId, guildId, newName);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Erro ao alterar o nome da guilda.' });
    }
};

exports.changeGuildImage = async (req, res) => {
    try {
        const editorId = req.user.id;
        const { guildId } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo de imagem foi enviado.' });
        }
        const newImageFilename = req.file.filename;

        const result = await guildService.changeGuildImage(editorId, guildId, newImageFilename);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Erro ao alterar a imagem da guilda.' });
    }
};

exports.deleteGuild = async (req, res) => {
    try {
        const leaderId = req.user.id;
        const { guildId } = req.params;
        const result = await guildService.deleteGuild(leaderId, guildId);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Erro ao deletar a guilda.' });
    }
};

// ====================================================================
// FUNÇÕES PARA O PAINEL DE ADMIN
// ====================================================================

exports.listCreationRequests = async (req, res) => {
    try {
        const { status } = req.query;
        const requests = await guildService.getGuildCreationRequests({ status });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar solicitações de criação de guilda.' });
    }
};

exports.approveCreation = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await guildService.approveGuildCreation(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Erro ao aprovar a guilda.' });
    }
};

exports.rejectCreation = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: 'O motivo da reprovação é obrigatório.' });
        }

        const result = await guildService.rejectGuildCreation(id, reason);
        res.status(200).json(result);

    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Erro ao reprovar a guilda.' });
    }
};