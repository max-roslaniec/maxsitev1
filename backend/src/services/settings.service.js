// backend/src/services/settings.service.js
const pool = require('../config/database');

/**
 * Busca todas as configurações e as retorna como um objeto.
 * Ex: { BRL_TO_CASH_RATE: '10000', SOL_TO_GCASH_RATE: '500000' }
 */
exports.getSettings = async () => {
    const [rows] = await pool.execute('SELECT * FROM settings');
    
    // Transforma o array do banco de dados em um objeto mais fácil de usar
    const settingsObject = rows.reduce((acc, { setting_key, setting_value }) => {
        acc[setting_key] = setting_value;
        return acc;
    }, {});

    return settingsObject;
};

/**
 * Atualiza múltiplas configurações no banco de dados.
 * @param {Object} settings - Um objeto com as chaves e valores a serem atualizados.
 * Ex: { BRL_TO_CASH_RATE: '12000' }
 */
exports.updateSettings = async (settings) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const updatePromises = Object.entries(settings).map(([key, value]) => {
            return connection.execute(
                `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE setting_value = ?`,
                [key, value, value]
            );
        });

        await Promise.all(updatePromises);
        await connection.commit();
        return { success: true, message: 'Configurações salvas com sucesso.' };
    } catch (error) {
        await connection.rollback();
        console.error("Erro ao salvar configurações:", error);
        throw new Error('Falha ao salvar as configurações no banco de dados.');
    } finally {
        connection.release();
    }
};