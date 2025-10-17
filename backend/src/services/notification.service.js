// backend/src/services/notification.service.js
const pool = require('../config/database');

/**
 * Cria uma nova notificação para um usuário.
 */
exports.createNotification = async (userId, message, connection = pool) => {
    try {
        await connection.execute(
            'INSERT INTO user_notifications (user_id, message) VALUES (?, ?)',
            [userId, message]
        );
    } catch (error) {
        console.error(`Falha ao criar notificação para o usuário ${userId}:`, error);
    }
};

/**
 * Busca as 20 notificações mais recentes de um usuário.
 */
exports.getNotifications = async (userId) => {
    const [notifications] = await pool.execute(
        'SELECT * FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
        [userId]
    );
    return notifications;
};

/**
 * Marca todas as notificações não lidas de um usuário como lidas.
 */
exports.markNotificationsAsRead = async (userId) => {
    await pool.execute(
        'UPDATE user_notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
        [userId]
    );
};