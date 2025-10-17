// backend/src/controllers/notification.controller.js
const notificationService = require('../services/notification.service');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await notificationService.getNotifications(userId);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Falha ao buscar notificações.' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await notificationService.markNotificationsAsRead(userId);
        res.status(200).json({ message: 'Notificações marcadas como lidas.' });
    } catch (error) {
        res.status(500).json({ message: 'Falha ao marcar notificações.' });
    }
};