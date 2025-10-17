// backend/src/controllers/shop.controller.js
const shopService = require('../services/shop.service');

// Para o site público (requer login de usuário)
exports.purchaseItem = async (req, res) => {
    try {
        const { itemId } = req.body;
        const userId = req.user.id; // Vem do middleware 'protect'
        if (!itemId) {
            return res.status(400).json({ message: 'O ID do item é obrigatório.' });
        }
        const result = await shopService.purchaseItem(userId, itemId);
        res.status(200).json({ message: `Item "${result.itemName}" comprado com sucesso!` });
    } catch (error) {
        console.error("Erro na compra:", error);
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        res.status(500).json({ message: 'Ocorreu um erro no servidor ao tentar realizar a compra.' });
    }
};

// Controller para comprar um item Gacha
exports.purchaseGachaItem = async (req, res) => {
    try {
        const { itemId } = req.body;
        const userId = req.user.id;

        if (!itemId) {
            return res.status(400).json({ message: 'O ID do item Gacha é obrigatório.' });
        }

        const reward = await shopService.purchaseGachaItem(userId, itemId);
        
        // Retorna os detalhes da recompensa para o frontend
        res.status(200).json({ 
            message: 'Gacha comprado com sucesso!',
            reward 
        });

    } catch (error) {
        console.error("Erro na compra do Gacha:", error);
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        res.status(500).json({ message: 'Ocorreu um erro no servidor ao tentar comprar o Gacha.' });
    }
};

// Controller para upload de imagem de recompensa Gacha
exports.uploadRewardImage = (req, res) => {
    console.log('[Controller]: uploadRewardImage called.');
    console.log('[Controller]: req.file object:', req.file);

    if (!req.file) {
        console.log('[Controller]: No file received.');
        return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }

    // O arquivo foi salvo pelo multer. Agora, retornamos o caminho para ser usado no frontend.
    // O caminho deve ser relativo à pasta 'public' do backend.
    const imageUrl = `/images/gacha_rewards/${req.file.filename}`;
    console.log(`[Controller]: Successfully uploaded. Image URL: ${imageUrl}`);
    
    res.status(201).json({ imageUrl });
};

/**
 * FUNÇÃO ATUALIZADA PARA LIDAR COM OS NOVOS PARÂMETROS DE BUSCA E PAGINAÇÃO
 * Lista todos os itens para o painel de admin.
 */
exports.listAllItems = async (req, res) => {
    try {
        const page = parseInt(req.query.page || 1, 10);
        const limit = parseInt(req.query.limit || 20, 10);
        const searchQuery = req.query.search || '';

        const data = await shopService.getAllShopItems({ page, limit, searchQuery });
        res.status(200).json(data);
    } catch (error) {
        console.error("Erro ao listar itens da loja:", error);
        res.status(500).json({ message: 'Erro ao listar itens da loja.' });
    }
};

// Pega os detalhes de um item específico para o formulário de edição
exports.getItemDetails = async (req, res) => {
    try {
        const item = await shopService.getShopItemById(req.params.id);
        res.status(200).json(item);
    } catch (error) {
        console.error("Erro ao buscar detalhes do item:", error);
        res.status(404).json({ message: error.message });
    }
};

// Cria um novo item na loja (recebe o upload de imagem)
exports.createItem = async (req, res) => {
    try {
        const imageName = req.file ? req.file.filename : 'avatar_teste.gif';
        const newItemData = { ...req.body, image: imageName };

        const newItem = await shopService.createShopItem(newItemData);
        res.status(201).json(newItem);
    } catch (error) {
        console.error("Erro ao criar item:", error);
        res.status(500).json({ message: 'Erro ao criar item.' });
    }
};

// Atualiza um item existente (pode receber ou não um novo upload de imagem)
exports.updateItem = async (req, res) => {
    try {
        const imageName = req.file ? req.file.filename : req.body.image;
        const updatedItemData = { ...req.body, image: imageName };

        await shopService.updateShopItem(req.params.id, updatedItemData);
        res.status(200).json({ message: 'Item atualizado com sucesso.' });
    } catch (error) {
        console.error("Erro ao atualizar item:", error);
        res.status(500).json({ message: 'Erro ao atualizar item.' });
    }
};

// Deleta um item da loja
exports.deleteItem = async (req, res) => {
    try {
        await shopService.deleteShopItem(req.params.id);
        res.status(204).send(); // Sucesso, sem conteúdo para retornar
    } catch (error) {
        console.error("Erro ao deletar item:", error);
        res.status(500).json({ message: 'Erro ao deletar item.' });
    }
};