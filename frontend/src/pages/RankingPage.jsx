// frontend/src/pages/RankingPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import UserPanel from '../components/UserPanel';
import LoginForm from '../components/LoginForm';

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

function RankingPage() {
  const { user } = useAuth();
  const [topPlayers, setTopPlayers] = useState([]);
  const [searchedPlayer, setSearchedPlayer] = useState(null);
  const [searchNick, setSearchNick] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPageEnabled, setIsPageEnabled] = useState(true);

  const fetchRanking = async (nickToSearch = '') => {
    setLoading(true);
    try {
      const response = await api.get(`/ranking?searchNick=${nickToSearch}`);
      setTopPlayers(response.data.topPlayers);
      setSearchedPlayer(response.data.searchedPlayer);
      if (nickToSearch && !response.data.searchedPlayer) {
        alert('Jogador não encontrado no ranking.');
      }
    } catch (err) {
      setError('Não foi possível carregar o ranking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const rankingResponse = await api.get('/ranking');
        setTopPlayers(rankingResponse.data.topPlayers);
      } catch (error) {
        setError('Não foi possível carregar o ranking.');
        setIsPageEnabled(false); // A rota falhou, então desativamos a página
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRanking(searchNick);
  };

  if (!isPageEnabled) {
    return (
        <div className="hightech-theme">
            <div className="site-wrapper">
                <div className="container"><p className="message error">Esta página está desativada.</p></div>
            </div>
        </div>
    );
  }

  return (
    <div className="hightech-theme">
        <div className="site-wrapper">
            <header className="main-banner">
                <img src="/images/portal/banner.webp" alt="Banner do Servidor" />
            </header>
            <div className="main-layout">
                <aside className="sidebar-left">
                    <h3>TOP 10 RANKING</h3>
                    <ol className="ranking-list-home">
                    {topPlayers.slice(0, 10).map(player => (
                        <li key={player.NickName}>
                        <img 
                            src={`/images/ranks/${rankIcons[player.TotalGrade] || 'chick.jpg'}`} 
                            alt="Rank Icon"
                            className="rank-icon"
                        />
                        <div className="player-info">
                            <span className="player-nick">{player.NickName}</span>
                            <span className="player-gp">{player.TotalScore.toLocaleString('pt-BR')} GP</span>
                        </div>
                        </li>
                    ))}
                    </ol>
                </aside>
                <main className="main-content">
                    <h1>Ranking de Jogadores</h1>

                    <div className="ranking-nav" style={{ textAlign: 'center', marginTop: '2rem', marginBottom: '2rem' }}>
                        <Link to="/ranking" className="action-btn add-btn" style={{ marginRight: '1rem' }}>Ranking de Jogadores</Link>
                        <Link to="/ranking/guilds" className="action-btn">Ranking de Guilds</Link>
                    </div>

                    <div className="search-container">
                        <form onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder="Buscar por Nickname..."
                            value={searchNick}
                            onChange={(e) => setSearchNick(e.target.value)}
                        />
                        <button type="submit">Buscar</button>
                        </form>
                    </div>

                    {loading ? <p style={{ textAlign: 'center' }}>Carregando...</p> : error ? <p className="message error">{error}</p> : (
                        <>
                            {searchedPlayer && (
                                <div className="search-result">
                                <h2>Resultado da Busca</h2>
                                <table className="ranking-table">
                                    <thead>
                                    <tr>
                                        <th>Posição</th>
                                        <th>Rank</th>
                                        <th>Nickname</th>
                                        <th>GP</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <tr>
                                        <td>{searchedPlayer.TotalRank}°</td>
                                        <td><img src={`/images/ranks/${rankIcons[searchedPlayer.TotalGrade] || 'chick.jpg'}`} alt="Rank Icon" /></td>
                                        <td className="nickname">{searchedPlayer.NickName}</td>
                                        <td>{searchedPlayer.TotalScore.toLocaleString('pt-BR')}</td>
                                    </tr>
                                    </tbody>
                                </table>
                                </div>
                            )}

                            <h2 style={{marginTop: '2rem'}}>TOP 20</h2>
                            <table className="ranking-table">
                                <thead>
                                <tr>
                                    <th>Posição</th>
                                    <th>Rank</th>
                                    <th>Nickname</th>
                                    <th>GP</th>
                                </tr>
                                </thead>
                                <tbody>
                                {topPlayers.map((player) => (
                                    <tr key={player.NickName}>
                                    <td>{player.TotalRank}°</td>
                                    <td><img src={`/images/ranks/${rankIcons[player.TotalGrade] || 'chick.jpg'}`} alt="Rank Icon" /></td>
                                    <td className="nickname">{player.NickName}</td>
                                    <td>{player.TotalScore.toLocaleString('pt-BR')}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </main>
                <aside className="sidebar-right">
                    { user ? <UserPanel /> : <LoginForm /> }
                </aside>
            </div>
        </div>
    </div>
  );
}

export default RankingPage;