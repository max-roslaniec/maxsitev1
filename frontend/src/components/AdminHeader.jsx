// frontend/src/components/AdminHeader.jsx
import { useAuth } from '../contexts/AuthContext';
import styles from '../admin.module.css';
import NotificationsPanel from './NotificationsPanel';

const AdminHeader = ({ onToggleSidebar }) => {
  const { logout, user } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button onClick={onToggleSidebar} className={styles.sidebarToggle}>
          &#9776;
        </button>
      </div>
      <div className={styles.headerRight}>
        <a href="/" target="_blank" rel="noopener noreferrer" className={styles.headerLink}>Ver Site</a>
        <NotificationsPanel />
        <div className={styles.userMenu}>
          <span className={styles.userName}>{user?.nickname || 'Admin'}</span>
          <a href="#" onClick={logout} className={styles.logoutButton}>Sair</a>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;