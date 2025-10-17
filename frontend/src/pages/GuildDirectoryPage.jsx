// frontend/src/pages/GuildDirectoryPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import UserPanel from '../components/UserPanel';
import LoginForm from '../components/LoginForm';

const MySwal = withReactContent(Swal);

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

function GuildDirectoryPage() {
    const [guilds, setGuilds] = useState([]);
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, userData, fetchUserData, accessToken } = useAuth();
    const navigate = useNavigate();
    const [isPageEnabled, setIsPageEnabled] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    useEffect(() => {
        const fetchPageData = async () => {
            setLoading(true);
            try {
                const [guildsResponse, homepageResponse] = await Promise.all([
                    api.get(`/guilds?page=${currentPage}&search=${debouncedSearchTerm}`),
                    api.get('/homepage')
                ]);
                setGuilds(guildsResponse.data.guilds);
                setTotalPages(guildsResponse.data.totalPages);
                setRanking(homepageResponse.data.ranking);
            } catch (err) {
                setError('Não foi possível carregar os dados da página.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const fetchSettings = async () => {
            try {
                const settingsResponse = await api.get('/admin/settings');
                setIsPageEnabled(settingsResponse.data.isGuildDirectoryEnabled === 'true');
            } catch (error) {
                console.log("Could not fetch admin settings, assuming page is enabled.");
            }
        };

        fetchPageData();
        if (currentPage === 1 && !debouncedSearchTerm) {
            fetchSettings();
        }
    }, [currentPage, debouncedSearchTerm]);

    const handleJoinRequest = async (guildId) => {
        const result = await MySwal.fire({
            title: 'Pedir para Participar',
            text: "Tem certeza que deseja pedir para participar desta guilda?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim, enviar pedido!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const response = await api.post(`/guilds/${guildId}/join-request`);
                MySwal.fire('Pedido Enviado!', response.data.message, 'success');
            } catch (err) {
                MySwal.fire('Erro!', err.response?.data?.message || 'Não foi possível enviar o pedido.', 'error');
            }
        }
    };

    const handleLeaveGuild = async () => {
        const result = await MySwal.fire({
            title: 'Sair da Guilda',
            text: "Tem certeza que deseja sair da sua guilda?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sim, sair!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const response = await api.post('/guilds/leave');
                MySwal.fire('Você Saiu', response.data.message, 'success');
                await fetchUserData(accessToken); 
            } catch (err) {
                MySwal.fire('Erro!', err.response?.data?.message || 'Não foi possível sair da guilda.', 'error');
            }
        }
    };

    const renderGuildButton = (guild) => {
        if (!user || !userData) {
            return <Link to="/login" className="action-btn" style={{backgroundColor: '#7f8c8d'}}>Faça Login</Link>;
        }
        if (userData.Guild) {
            if (userData.Guild === guild.name) {
                if (userData.guild_role === 'Líder') {
                    return <button onClick={() => navigate(`/guild/manage/${guild.id}`)} className="action-btn" style={{backgroundColor: '#f39c12'}}>Gerenciar Guild</button>;
                } else {
                    return <button onClick={handleLeaveGuild} className="action-btn delete-btn">Sair da Guild</button>;
                }
            } else { 
                return <button className="action-btn" disabled style={{backgroundColor: '#333', cursor: 'not-allowed'}}>Em outra guild</button>;
            }
        }
        return <button onClick={() => handleJoinRequest(guild.id)} className="action-btn add-btn">Pedir para Participar</button>;
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;
        const pageButtons = [];
        for (let i = 1; i <= totalPages; i++) {
          pageButtons.push(
            <button key={i} onClick={() => setCurrentPage(i)} className={currentPage === i ? 'active' : ''}>
              {i}
            </button>
          );
        }
        return (
          <div className="pagination">
            {currentPage > 1 && <button onClick={() => setCurrentPage(p => p - 1)} className="prev-next">&laquo; Anterior</button>}
            <div className="page-numbers">{pageButtons}</div>
            {currentPage < totalPages && <button onClick={() => setCurrentPage(p => p + 1)} className="prev-next">Próxima &raquo;</button>}
          </div>
        );
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
                        {ranking.map(player => (
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h1>Diretório de Guilds</h1>
                            {user && !userData?.Guild && (
                                <Link to="/guilds/create" className="register-button" style={{textDecoration: 'none'}}>
                                    Criar sua Guild
                                </Link>
                            )}
                        </div>
                        
                        <div className="search-bar-container" style={{ marginBottom: '2rem' }}>
                            <input
                                type="text"
                                placeholder="Buscar guild por nome..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    borderRadius: '5px',
                                    border: '1px solid #444',
                                    backgroundColor: '#1f1f1f',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                        
                        {loading ? <p>Carregando guilds...</p> : error ? <p className="message error">{error}</p> : (
                            <>
                                {guilds.length === 0 && !loading && (
                                    <p className="message">Nenhuma guilda encontrada com o termo "{debouncedSearchTerm}".</p>
                                )}
                                <div className="guild-list-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                    {guilds.map(guild => (
                                        <div key={guild.id} className="guild-card" style={{ backgroundColor: '#1f1f1f', border: '1px solid #444', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                                {guild.imageUrl ? (
                                                    <img src={guild.imageUrl} alt={`Emblema da ${guild.name}`} style={{ width: '80px', height: 'auto', borderRadius: '4px' }} />
                                                ) : (
                                                    <div style={{ width: '80px', height: '40px', backgroundColor: '#151515', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', fontSize: '0.8em' }}>Sem Imagem</div>
                                                )}
                                                <div>
                                                    <h2 style={{ margin: 0, color: '#ff5555' }}>{guild.name}</h2>
                                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>Líder: {guild.leader_nickname}</p>
                                                </div>
                                            </div>
                                            <p style={{ flexGrow: 1, marginBottom: '1rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{guild.description}</p>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                                                <span>Membros: {guild.member_count}</span>
                                                <div style={{display: 'flex', gap: '10px'}}>
                                                    {guild.discord_url && (
                                                        <a href={guild.discord_url} target="_blank" rel="noopener noreferrer" className="action-btn" style={{backgroundColor: '#5865F2'}}><i className="bi bi-discord"></i></a>
                                                    )}
                                                    {renderGuildButton(guild)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {renderPagination()}
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

export default GuildDirectoryPage;