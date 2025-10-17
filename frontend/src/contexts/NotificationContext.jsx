// src/contexts/NotificationContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axios';
import AuthContext from './AuthContext';

const defaultState = {
    notifications: [],
    unreadCount: 0,
    isLoading: true,
    markAllAsRead: () => Promise.resolve(),
    fetchNotifications: () => Promise.resolve(),
};

export const NotificationContext = createContext(defaultState);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const { user } = useContext(AuthContext) || {};

    const fetchNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.get('/notifications');
            const fetchedNotifications = response.data;
            setNotifications(fetchedNotifications);
            const newUnreadCount = fetchedNotifications.filter(n => !n.is_read).length;
            setUnreadCount(newUnreadCount);
        } catch (error) {
            console.error('Falha ao buscar notificações:', error);
            // Em caso de erro, zera para não mostrar dados incorretos
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications(); // Busca inicial

        const intervalId = setInterval(() => {
            fetchNotifications();
        }, 30000); // Busca a cada 30 segundos

        // Limpa o intervalo quando o componente é desmontado ou o usuário muda
        return () => clearInterval(intervalId);
    }, [fetchNotifications]);

    const markAllAsRead = useCallback(async () => {
        if (unreadCount === 0) return;

        try {
            await api.patch('/notifications/read');
            // Após marcar como lidas, atualiza o estado local imediatamente
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            // Opcional: pode refazer o fetch para garantir consistência total
            // fetchNotifications(); 
        } catch (error) {
            console.error('Falha ao marcar notificações como lidas:', error);
        }
    }, [unreadCount]);

    const value = {
        notifications,
        unreadCount,
        isLoading,
        markAllAsRead,
        fetchNotifications // Exporta para atualizações manuais se necessário
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
