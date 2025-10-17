// backend/src/controllers/inventory.controller.js
const inventoryService = require('../services/inventory.service');

exports.listUserInventory = async (req, res) => {
    try {
        const inventory = await inventoryService.getUserInventory(req.params.id);
        res.status(200).json(inventory);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar inventário do usuário.' });
    }
};

// FUNÇÃO ATUALIZADA PARA LIDAR COM ERROS ESPECÍFICOS
exports.addItem = async (req, res) => {
    try {
        const { userId, itemId } = req.body;
        if (!userId || !itemId) {
            return res.status(400).json({ message: 'userId e itemId são obrigatórios.' });
        }
        const result = await inventoryService.addItemToInventory(userId, itemId);
        res.status(201).json({ message: result.message });
    } catch (error) {
        // Verifica se o erro vindo do serviço tem um status code customizado (404, 409, etc)
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        // Se não tiver, é um erro interno do servidor (500)
        console.error("Erro ao adicionar item:", error); // Logamos o erro para depuração
        res.status(500).json({ message: 'Ocorreu um erro inesperado ao adicionar o item.' });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        await inventoryService.deleteItemFromInventory(req.params.itemNo);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar item do inventário.' });
    }
};