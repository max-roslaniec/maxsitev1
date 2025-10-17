// frontend/src/components/UserPanel.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

// TODO: Mover para variáveis de ambiente
const GCASH_TOKEN_ADDRESS = "GgrKV3TcrPoDkCrzx9gMFRJgTC1nxNEDtx7NnVJAKPPE";

const rankIcons = {
  '-4': 'silver_dragon.jpg', '-3': 'red_dragon.jpg', '-2': 'blue_dragon.jpg',
  '-1': 'diamond_wand.jpg', '0': 'ruby_wand.jpg', '1': 'sapphire_wand.jpg',
  '2': 'violet_wand.jpg', '3': 'golden_battle_axe_plus.jpg', '4': 'golden_battle_axe.jpg',
  '5': 'silver_battle_axe_plus.jpg', '6': 'silver_battle_axe.jpg', '7': 'battle_axe_plus.jpg',
  '8': 'battle_axe.jpg', '9': 'double_gold_axe.jpg', '10': 'gold_axe.jpg',
  '11': 'double_silver_axe.jpg', '12': 'silver_axe.jpg', '13': 'double_metal_axe.jpg',
  '14': 'metal_axe.jpg', '15': 'double_stone_hammer.jpg', '16': 'stone_hammer.jpg',
  '17': 'double_wooden_hammer.jpg', '18': 'wooden_hammer.jpg', '19': 'chick.jpg',
  '20': 'gm.jpg'
};

function UserPanel() {
  const { user, userData, logout } = useAuth();
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const navigate = useNavigate();

  const [gcashBalance, setGcashBalance] = useState(0);

  useEffect(() => {
    const fetchGcashBalance = async () => {
      if (!publicKey) {
        setGcashBalance(0);
        return;
      }
      try {
        const gcashMint = new PublicKey(GCASH_TOKEN_ADDRESS);
        const userAta = await getAssociatedTokenAddress(gcashMint, publicKey);
        const balanceInfo = await connection.getTokenAccountBalance(userAta);
        setGcashBalance(balanceInfo.value.uiAmount || 0);
      } catch (err) {
        setGcashBalance(0);
        console.log("Não foi possível buscar o saldo de GCASH no painel, a conta pode não existir.");
      }
    };

    fetchGcashBalance();
    const interval = setInterval(fetchGcashBalance, 30000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  const formatNumber = (number) => {
    if (typeof number !== 'number') {
      return '...';
    }
    return number.toLocaleString('pt-BR');
  };

  const getPowerUserRemainingTime = () => {
    if (!userData?.power_user_expires_at) {
      return 'N/A';
    }
    const expireDate = new Date(userData.power_user_expires_at);
    const now = new Date();
    const diffTime = expireDate - now;

    if (diffTime <= 0) {
        return "Expirado";
    }
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
        return `${diffDays}d ${diffHours}h restantes`;
    }
    return `${diffHours}h restantes`;
  };

  if (!user) {
    return null;
  }

  const guildId = userData?.guild_id;

  return (
    <div className="user-panel">
      <h3>Bem-vindo, {user.nickname}!</h3>
      
      <div className="user-stats">
        <div className="stat-item">
            <span className="stat-label">
              GP
              {userData && (
                <img
                  src={`/images/ranks/${rankIcons[userData.TotalGrade] || 'chick.jpg'}`}
                  alt="Rank Icon"
                  className="stat-rank-icon"
                />
              )}
            </span>
            <span className="stat-value gp">
                {userData ? formatNumber(userData.TotalScore) : '...'}
            </span>
        </div>
        <div className="stat-item">
            <span className="stat-label">Ranking</span>
            <span className="stat-value" style={{color: '#87CEEB'}}>
                {userData && userData.TotalRank > 0 ? `${userData.TotalRank}°` : 'N/A'}
            </span>
        </div>
        <div className="stat-item">
            <span className="stat-label">GCash</span>
            <span className="stat-value" style={{color: '#9945FF'}}>
                {publicKey ? formatNumber(gcashBalance) : 'N/A'}
            </span>
        </div>
        <div className="stat-item">
            <span className="stat-label">Gold</span>
            <span className="stat-value gold">
                {userData ? formatNumber(userData.Money) : '...'}
            </span>
        </div>
        <div className="stat-item">
            <span className="stat-label">Cash</span>
            <span className="stat-value cash">
                {userData ? formatNumber(userData.Cash) : '...'}
            </span>
        </div>
        
        <div className="stat-item">
            <span className="stat-label">Guild</span>
            <span className="stat-value" style={{color: '#3498db'}}>{userData?.Guild || 'N/A'}</span>
        </div>
        <div className="stat-item">
            <span className="stat-label">Power User</span>
            <span className="stat-value" style={{color: '#f1c40f'}}>{getPowerUserRemainingTime()}</span>
        </div>
      </div>

      {userData?.guild_role && ['Líder', 'Moderador'].includes(userData.guild_role) && (
        <button onClick={() => navigate(`/guild/manage/${guildId}`)} className="manage-guild-button">
          Gerenciar Guild
        </button>
      )}

      <button onClick={logout} className="logout-button">Sair</button>
    </div>
  );
}

export default UserPanel;