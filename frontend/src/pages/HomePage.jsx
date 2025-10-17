// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/LoginForm';
import UserPanel from '../components/UserPanel';

// Objeto que mapeia o 'TotalGrade' do banco para um nome de arquivo de imagem
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

function HomePage() {
  const [news, setNews] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/homepage');
        setNews(response.data.news);
        setRanking(response.data.ranking);
      } catch (err) {
        console.error("Erro ao buscar dados da homepage:", err);
        setError('Não foi possível carregar os dados do servidor.');
      }
    };
    fetchData();
  }, []);

  if (error) {
    return <p className="message error">{error}</p>;
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
            <a href="#" className="download-button">DOWNLOAD DO JOGO</a>

            <div className="news-container">
              <h3>ÚLTIMAS NOTÍCIAS</h3>
              {/* Esta é a parte que estava faltando: o <Link> para as notícias */}
              {news.map(article => (
                <Link to={`/news/${article.id}`} key={article.id} className="news-card">
                  <h4>{article.title}</h4>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: article.content.substring(0, 150) + '...'
                    }}
                  />
                  <div className="news-card-footer">
                    <span>Por: {article.author}</span>
                    <span>Leia Mais &rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          </main>

          <aside className="sidebar-right">
            { user ? <UserPanel /> : <LoginForm /> }
            <a href="#" className="download-button">DOWNLOAD DO JOGO</a>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default HomePage;