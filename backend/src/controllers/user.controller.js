// backend/src/controllers/user.controller.js
const userService = require('../services/user.service');

// Para o site público
exports.getCurrentUserData = async (req, res) => {
    try {
        const userData = await userService.getUserDataById(req.user.id);
        res.status(200).json(userData);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// --- Controllers de ADMIN ---
exports.listUsers = async (req, res) => {
    try {
        // Extrai os parâmetros da URL, com valores padrão
        const page = parseInt(req.query.page || 1, 10);
        const limit = parseInt(req.query.limit || 20, 10);
        const searchQuery = req.query.search || '';

        // Passa os parâmetros para o serviço
        const data = await userService.getAllUsers({ page, limit, searchQuery });
        
        res.status(200).json(data);
    } catch (error) {
        console.error('Erro ao listar usuários no controlador:', error);
        res.status(500).json({ message: 'Erro ao listar usuários.' });
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        const user = await userService.getUserForEdit(req.params.id);
        res.status(200).json(user);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

exports.updateUserDetails = async (req, res) => {
    try {
        await userService.updateUser(req.params.id, req.body);
        res.status(200).json({ message: 'Usuário atualizado com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar usuário.' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await userService.deleteUser(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar usuário.' });
    }
};
