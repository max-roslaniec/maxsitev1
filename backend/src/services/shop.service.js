const pool = require('../config/database');
const userService = require('./user.service');

// --- Funções para o Site Público ---

exports.purchaseGachaItem = async (userId, itemId) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const [itemRows] = await connection.execute('SELECT * FROM shop_items WHERE itemId = ? AND type = \'GACHA\'', [itemId]);
        if (itemRows.length === 0) {
            throw { status: 404, message: 'Item Gacha não encontrado ou não é um item Gacha.' };
        }
        const gachaItem = itemRows[0];

        const [cashRows] = await connection.execute('SELECT Cash FROM cash WHERE ID = ? FOR UPDATE', [userId]);
        if (cashRows.length === 0 || cashRows[0].Cash < gachaItem.price_cash) {
            throw { status: 403, message: 'Saldo de CASH insuficiente.' };
        }
        await connection.execute('UPDATE cash SET Cash = Cash - ? WHERE ID = ?', [gachaItem.price_cash, userId]);

        const userData = await userService.getUserDataById(userId);
        const userInventory = userData.inventory || [];

        const [allRewards] = await connection.execute('SELECT * FROM gacha_rewards WHERE gacha_item_id = ?', [itemId]);
        if (allRewards.length === 0) {
            throw { status: 500, message: 'Este item Gacha não possui recompensas configuradas.' };
        }

        const possibleRewards = allRewards.filter(reward => 
            reward.reward_type !== 'ITEM' || !userInventory.includes(reward.reward_ref)
        );

        if (possibleRewards.length === 0) {
            throw { status: 409, message: 'Você já possui todas as recompensas possíveis deste Gacha.' };
        }

        // CORREÇÃO: Lógica de gacha cumulativa para garantir a distribuição correta das chances.
        const totalChance = possibleRewards.reduce((sum, reward) => sum + parseFloat(reward.chance || 0), 0);
        const randomPoint = Math.random() * totalChance;
        let cumulativeChance = 0;
        let chosenReward = null;

        for (const reward of possibleRewards) {
            cumulativeChance += parseFloat(reward.chance || 0);
            if (randomPoint < cumulativeChance) {
                chosenReward = reward;
                break;
            }
        }
        
        // Fallback para garantir que uma recompensa seja sempre escolhida, mesmo em casos extremos.
        if (!chosenReward) {
            chosenReward = possibleRewards[possibleRewards.length - 1];
        }

        switch (chosenReward.reward_type) {
            case 'ITEM':
                const [maxNoRows] = await connection.execute('SELECT MAX(`No`) as maxNo FROM chest');
                const newNo = (maxNoRows[0].maxNo || 0) + 1;
                await connection.execute(
                    `INSERT INTO chest (Owner, Item, Wearing, Acquisition, Expire, ExpireType, \`No\`, Volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?) `,
                    [userId, chosenReward.reward_ref, 0, 'G', null, 'I', newNo, 1]
                );
                break;
            case 'GOLD':
                await connection.execute('UPDATE game SET Money = Money + ? WHERE Id = ?', [chosenReward.reward_value, userId]);
                break;
            case 'CASH':
                await connection.execute('UPDATE cash SET Cash = Cash + ? WHERE ID = ?', [chosenReward.reward_value, userId]);
                break;
        }

        await connection.commit();

        return {
            type: chosenReward.reward_type,
            name: chosenReward.reward_name,
            image: chosenReward.reward_image,
            value: chosenReward.reward_value,
            ref: chosenReward.reward_ref
        };

    } catch (error) {
        await connection.rollback();
        if (error.status) throw error;
        console.error("Erro na compra do Gacha (service):", error);
        throw { status: 500, message: 'Erro interno no servidor durante a compra do Gacha.' };
    } finally {
        connection.release();
    }
};

exports.purchaseItem = async (userId, itemId) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
        const [itemRows] = await connection.execute('SELECT price_cash, name, duration FROM shop_items WHERE itemId = ?', [itemId]);
        if (itemRows.length === 0) {
            throw { status: 404, message: 'Item não encontrado na loja.' };
        }
        const item = itemRows[0];

        if (item.price_cash === null) {
            throw { status: 400, message: 'Este item não pode ser comprado com CASH.' };
        }

        const [existingRows] = await connection.execute('SELECT COUNT(*) as count FROM chest WHERE Owner = ? AND Item = ?', [userId, itemId]);
        if (existingRows[0].count > 0) {
            throw { status: 409, message: 'Você já possui este item.' };
        }

        const [cashRows] = await connection.execute('SELECT Cash FROM cash WHERE ID = ? FOR UPDATE', [userId]);
        if (cashRows.length === 0 || cashRows[0].Cash < item.price_cash) {
            throw { status: 403, message: 'Saldo de CASH insuficiente.' };
        }
        
        await connection.execute('UPDATE cash SET Cash = Cash - ? WHERE ID = ?', [item.price_cash, userId]);

        let expireDate = null;
        let expireType = 'I'; 

        if (item.duration === 'Mensal') {
            expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 30);
            expireType = 'M';
        }

        const [maxNoRows] = await connection.execute('SELECT MAX(`No`) as maxNo FROM chest');
        const newNo = (maxNoRows[0].maxNo || 0) + 1;
        
        await connection.execute(
            `INSERT INTO chest (Owner, Item, Wearing, Acquisition, Expire, ExpireType, \`No\`, Volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, itemId, 0, 'C', expireDate, expireType, newNo, 1]
        );
        
        await connection.commit();
        return { success: true, itemName: item.name };
    } catch (error) {
        await connection.rollback();
        if (error.status) throw error;
        console.error("Erro na compra (shop.service):", error);
        throw { status: 500, message: 'Erro interno no servidor durante a transação.' };
    } finally {
        connection.release();
    }
};

// --- Funções de ADMIN ---

exports.getAllShopItems = async ({ page = 1, limit = 20, searchQuery = '' }) => {
    let searchSql = '';
    const params = [];

    if (searchQuery) {
        searchSql = 'WHERE name LIKE ? OR itemId = ?';
        params.push(`%${searchQuery}%`, searchQuery);
    }

    const [[{ totalItems }]] = await pool.execute(`SELECT COUNT(*) as totalItems FROM shop_items ${searchSql}`, params);

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const [items] = await pool.execute(
        `SELECT * FROM shop_items ${searchSql} ORDER BY name ASC LIMIT ? OFFSET ?`,
        params
    );

    return {
        items,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
    };
};

exports.getShopItemById = async (itemId) => {
    const [rows] = await pool.execute('SELECT * FROM shop_items WHERE itemId = ?', [itemId]);
    if (rows.length === 0) {
        throw new Error('Item da loja não encontrado.');
    }
    
    const item = rows[0];
    item.rewards = []; // Inicializa com um array vazio

    if (item.type && item.type.trim().toUpperCase() === 'GACHA') {
        const [rewards] = await pool.execute('SELECT * FROM gacha_rewards WHERE gacha_item_id = ?', [itemId]);
        if (rewards) {
            item.rewards = rewards;
        }
    }

    return item;
};

const parseAndSanitizeRewards = (rewardsData) => {
    if (!rewardsData) return [];
    
    let rewards = [];
    if (typeof rewardsData === 'string') {
        try {
            rewards = JSON.parse(rewardsData);
        } catch (e) {
            console.error("Erro ao fazer parse das recompensas JSON:", e);
            return []; // Retorna array vazio se o JSON for inválido
        }
    } else if (Array.isArray(rewardsData)) {
        rewards = rewardsData;
    }

    if (!Array.isArray(rewards)) return [];

    return rewards.map(reward => ([
        reward.reward_type || 'ITEM',
        reward.reward_name || '',
        reward.reward_ref || null,
        reward.reward_value || null,
        reward.reward_image || null,
        reward.chance || null
    ]));
};

exports.createShopItem = async (itemData) => {
    const { itemId, name, image, duration, gender, type, content, price_cash, price_gcash } = itemData;
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        await connection.execute(
            'INSERT INTO shop_items (itemId, name, image, duration, gender, type, content, price_cash, price_gcash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [itemId, name, image, duration, gender, type, content, price_cash || null, price_gcash || null]
        );

        if (type === 'GACHA') {
            const rewardsValues = parseAndSanitizeRewards(itemData.rewards).map(reward => [itemId, ...reward]);
            
            if (rewardsValues.length > 0) {
                await connection.query(
                    'INSERT INTO gacha_rewards (gacha_item_id, reward_type, reward_name, reward_ref, reward_value, reward_image, chance) VALUES ?',
                    [rewardsValues]
                );
            }
        }

        await connection.commit();
        return { id: itemId, ...itemData };

    } catch (error) {
        await connection.rollback();
        console.error("Erro ao criar item Gacha no serviço:", error);
        throw error;
    } finally {
        connection.release();
    }
};

exports.updateShopItem = async (itemId, itemData) => {
    const { name, image, duration, gender, type, content, price_cash, price_gcash } = itemData;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        await connection.execute(
            'UPDATE shop_items SET name = ?, image = ?, duration = ?, gender = ?, type = ?, content = ?, price_cash = ?, price_gcash = ? WHERE itemId = ?',
            [name, image, duration, gender, type, content, price_cash || null, price_gcash || null, itemId]
        );

        if (type === 'GACHA') {
            await connection.execute('DELETE FROM gacha_rewards WHERE gacha_item_id = ?', [itemId]);
            
            const rewardsValues = parseAndSanitizeRewards(itemData.rewards).map(reward => [itemId, ...reward]);

            if (rewardsValues.length > 0) {
                await connection.query(
                    'INSERT INTO gacha_rewards (gacha_item_id, reward_type, reward_name, reward_ref, reward_value, reward_image, chance) VALUES ?',
                    [rewardsValues]
                );
            }
        }

        await connection.commit();
        return { success: true };

    } catch (error) {
        await connection.rollback();
        console.error("Erro ao atualizar item Gacha no serviço:", error);
        throw error;
    } finally {
        connection.release();
    }
};

exports.deleteShopItem = async (itemId) => {
    const [result] = await pool.execute('DELETE FROM shop_items WHERE itemId = ?', [itemId]);
    if (result.affectedRows === 0) throw new Error('Item não encontrado para deletar.');
    return { success: true };
};
