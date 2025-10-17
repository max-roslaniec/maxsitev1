// frontend/src/components/AdminSidebar.jsx
import { NavLink } from 'react-router-dom';
import styles from '../admin.module.css';

const AdminSidebar = ({ isOpen, onClose }) => {
  const activeLinkStyle = {
    backgroundColor: '#c0392b',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
            <h2>GUNBOUND</h2>
            <button onClick={onClose} className={styles.sidebarCloseBtn}>&times;</button>
        </div>
      <nav className={styles.sidebarNav}>
        <NavLink to="/admin" end style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
          <span>Painel Principal</span>
        </NavLink>
        <NavLink to="/admin/shop" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
          <span>Gerenciar Loja</span>
        </NavLink>
        <NavLink to="/admin/users" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
          <span>Gerenciar Usuários</span>
        </NavLink>
        <NavLink to="/admin/news" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
          <span>Gerenciar Notícias</span>
        </NavLink>
        <NavLink to="/admin/swaps" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
          <span>Gerenciar Swaps</span>
        </NavLink>
        <NavLink to="/admin/guilds/requests" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
          <span>Pedidos de Guild</span>
        </NavLink>
        <NavLink to="/admin/settings" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
          <span>Configurações</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default AdminSidebar;