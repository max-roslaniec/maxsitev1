// frontend/src/pages/GuildRankingPage.jsx
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

function GuildRankingPage() {
    const { user } = useAuth();
    const [rankedGuilds, setRankedGuilds] = useState([]);
    const [playerRanking, setPlayerRanking] = useState([]);
    const [searchedGuild, setSearchedGuild] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isPageEnabled, setIsPageEnabled] = useState(true);

    const fetchGuildRanking = async (searchQuery = '') => {
        setLoading(true);
        try {
            const [guildsResponse, homeResponse] = await Promise.all([
                api.get(`/guilds/ranking?search=${searchQuery}`),
                api.get('/homepage')
            ]);

            setRankedGuilds(guildsResponse.data.rankedGuilds);
            setSearchedGuild(guildsResponse.data.searchedGuild);
            setPlayerRanking(homeResponse.data.ranking);

            if (searchQuery && !guildsResponse.data.searchedGuild) {
                alert('Guild não encontrada no ranking.');
            }
        } catch (err) {
            setError('Não foi possível carregar os dados da página.');
            console.error("Erro ao buscar dados:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settingsResponse = await api.get('/admin/settings');
                setIsPageEnabled(settingsResponse.data.isGuildRankingEnabled === 'true');
            } catch (error) {
                console.log("Could not fetch admin settings, assuming page is enabled.");
            }
        };
        fetchSettings();
        fetchGuildRanking();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchGuildRanking(searchTerm);
    };

    if (!isPageEnabled) {
        return <div className="container"><p className="message error">Esta página está desativada.</p></div>;
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
                        {playerRanking.map(player => (
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
                        <h1>Ranking de Guilds</h1>

                        <div className="ranking-nav" style={{ textAlign: 'center', marginTop: '2rem', marginBottom: '2rem' }}>
                            <Link to="/ranking" className="action-btn">Ranking de Jogadores</Link>
                            <Link to="/ranking/guilds" className="action-btn add-btn" style={{ marginLeft: '1rem' }}>Ranking de Guilds</Link>
                        </div>
                        
                        <div className="search-container">
                            <form onSubmit={handleSearch}>
                                <input
                                    type="text"
                                    placeholder="Buscar por nome da Guild..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button type="submit">Buscar</button>
                            </form>
                        </div>

                        {loading ? <p>Carregando...</p> : error ? <p className="message error">{error}</p> : (
                            <>
                                {searchedGuild && (
                                    <div className="search-result">
                                        <h2>Resultado da Busca</h2>
                                        <table className="ranking-table">
                                            <thead>
                                                <tr>
                                                    <th>Posição</th>
                                                    <th>Emblema</th>
                                                    <th>Nome da Guilda</th>
                                                    <th>Líder</th>
                                                    <th>Membros</th>
                                                    <th>GP Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>{searchedGuild.rank}°</td>
                                                    <td>
                                                        {searchedGuild.imageUrl ? (
                                                            <img src={searchedGuild.imageUrl} alt={`Emblema da ${searchedGuild.name}`} style={{ width: '80px', height: 'auto', borderRadius: '4px' }} />
                                                        ) : ( <div style={{width: '80px', height: '40px', backgroundColor: '#151515'}}></div> )}
                                                    </td>
                                                    <td className="nickname">{searchedGuild.name}</td>
                                                    <td>{searchedGuild.leader_nickname}</td>
                                                    <td>{searchedGuild.member_count}</td>
                                                    <td>{searchedGuild.total_gp.toLocaleString('pt-BR')}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                
                                <h2 style={{marginTop: '2rem'}}>Ranking Principal</h2>
                                <table className="ranking-table">
                                    <thead>
                                        <tr>
                                            <th>Posição</th>
                                            <th>Emblema</th>
                                            <th>Nome da Guilda</th>
                                            <th>Líder</th>
                                            <th>Membros</th>
                                            <th>GP Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rankedGuilds.map((guild) => (
                                            <tr key={guild.name}>
                                                <td>{guild.rank}°</td>
                                                <td>
                                                    {guild.imageUrl ? (
                                                        <img src={guild.imageUrl} alt={`Emblema da ${guild.name}`} style={{ width: '80px', height: 'auto', borderRadius: '4px' }} />
                                                    ) : (
                                                        <div style={{ width: '80px', height: '40px', backgroundColor: '#151515', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', fontSize: '0.8em' }}>Sem Imagem</div>
                                                    )}
                                                </td>
                                                <td className="nickname">{guild.name}</td>
                                                <td>{guild.leader_nickname}</td>
                                                <td>{guild.member_count}</td>
                                                <td>{guild.total_gp.toLocaleString('pt-BR')}</td>
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

export default GuildRankingPage;