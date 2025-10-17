// backend/src/services/inventory.service.js
const pool = require('../config/database');

exports.getUserInventory = async (userId) => {
    const [items] = await pool.execute(
        `SELECT c.No, c.Item AS itemId, s.name, s.gender, s.type 
         FROM chest c
         JOIN shop_items s ON c.Item = s.itemId
         WHERE c.Owner = ?
         ORDER BY s.name ASC`,
        [userId]
    );
    return items;
};

exports.addItemToInventory = async (userId, itemId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Verifica se o item existe e busca sua 'duration' e 'name'
        const [itemCheck] = await connection.execute('SELECT name, duration FROM shop_items WHERE itemId = ?', [itemId]);
        if (itemCheck.length === 0) {
            throw { status: 404, message: 'O ID do item informado não existe na loja.' };
        }
        const { name: itemName, duration: itemDuration } = itemCheck[0];
        
        // 2. Validação: Verifica se o usuário já possui este item
        const [existingItem] = await connection.execute( 'SELECT COUNT(*) as count FROM chest WHERE Owner = ? AND Item = ?', [userId, itemId]);
        if (existingItem[0].count > 0) {
            throw { status: 409, message: 'Este usuário já possui o item informado.' };
        }

        // --- LÓGICA DE EXPIRAÇÃO APLICADA AQUI ---
        let expireDate = null;
        let expireType = 'I'; // I = Ilimitado/Eterno (Padrão)

        if (itemDuration === 'Mensal') {
            expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 30); // Adiciona 30 dias
            expireType = 'M'; // M = Mensal
        }

        const [maxNoRows] = await connection.execute('SELECT MAX(`No`) as maxNo FROM chest');
        const newNo = (maxNoRows[0].maxNo || 0) + 1;
        
        await connection.execute(
            `INSERT INTO chest (Owner, Item, Wearing, Acquisition, Expire, ExpireType, \`No\`, PlaceOrder, Recovered, Volume) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 1)`,
            [userId, itemId, 0, 'C', expireDate, expireType, newNo]
        );

        await connection.commit();
        return { success: true, message: `Item "${itemName}" (ID: ${itemId}) adicionado com sucesso.` };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

exports.deleteItemFromInventory = async (itemNo) => {
    const [result] = await pool.execute(
        'DELETE FROM chest WHERE `No` = ?',
        [itemNo]
    );
    if (result.affectedRows === 0) {
        throw new Error('Item do inventário não encontrado para deletar.');
    }
    return { success: true };
};