// frontend/src/components/NotificationsPanel.jsx
import { useState, useEffect, useRef, useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';

function NotificationsPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef(null);

    // 1. Consumir o estado global do nosso novo contexto
    const { notifications, unreadCount, markAllAsRead } = useContext(NotificationContext);

    // Efeito para fechar o painel ao clicar fora (continua sendo uma lógica local)
    useEffect(() => {
        function handleClickOutside(event) {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [panelRef]);

    // 2. Ao abrir o painel, marca as notificações como lidas
    const handleToggle = () => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);
        if (newIsOpen && unreadCount > 0) {
            markAllAsRead();
        }
    };

    return (
        <div className="notifications-container" ref={panelRef}>
            <button onClick={handleToggle} className="notification-bell">
                <span role="img" aria-label="Notificações">🔔</span>
                {/* 3. Usa o unreadCount diretamente do contexto */}
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            {isOpen && (
                <div className="notifications-dropdown">
                    <div className="notifications-header">Notificações</div>
                    {/* 4. Usa a lista de notificações diretamente do contexto */}
                    {notifications.length > 0 ? (
                        <ul>
                            {notifications.map(notif => (
                                <li key={notif.id} style={{ opacity: notif.is_read ? 0.6 : 1 }}>
                                    <p>{notif.message}</p>
                                    <small>{new Date(notif.created_at).toLocaleString('pt-BR')}</small>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-notifications">Nenhuma notificação.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationsPanel;
