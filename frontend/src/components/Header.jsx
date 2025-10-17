// frontend/src/components/Header.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationsPanel from './NotificationsPanel';

function Header() {
  const { user } = useAuth();
  return (
    <nav className="main-nav">
      <div className="nav-links-left">
        <Link to="/">Home</Link> <Link to="/shop">Loja</Link> <Link to="/ranking">Ranking</Link>
        <Link to="/topup">Top-Up</Link> <Link to="/swap">SWAP</Link> <Link to="/guilds">Guilds</Link>
      </div>
      <div className="nav-links-right">
        {user && <NotificationsPanel />}
        {!user && (<><Link to="/register">Criar Conta</Link> <Link to="/login">Login</Link></>)}
      </div>
    </nav>
  );
}
export default Header;