// src/pages/NewsArticlePage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

function NewsArticlePage() {
  const [article, setArticle] = useState(null);
  const [error, setError] = useState('');
  const { id } = useParams(); // Pega o 'id' da URL (ex: /news/1)

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await api.get(`/news/${id}`);
        setArticle(response.data);
      } catch (err) {
        console.error("Erro ao buscar artigo:", err);
        setError('Não foi possível encontrar a notícia solicitada.');
      }
    };
    fetchArticle();
  }, [id]); // Roda o efeito sempre que o ID na URL mudar

  if (error) {
    return <p className="message error">{error}</p>;
  }

  if (!article) {
    return <p style={{ textAlign: 'center' }}>Carregando notícia...</p>;
  }

  return (
    <div className="hightech-theme">
      <div className="site-wrapper">
        <div className="container">
          {/* Usamos as classes do seu CSS para replicar o visual do 'news-full-article' */}
          <article className="news-card">
            <h1>{article.title}</h1>
            <p className="news-card-footer" style={{justifyContent: 'center', marginBottom: '2rem'}}>
              Postado por {article.author}
            </p>
            
            {article.image_url && (
              <img src={article.image_url} alt={article.title} style={{width: '100%', borderRadius: '8px', marginBottom: '2rem'}} />
            )}

            {/* O 'dangerouslySetInnerHTML' é necessário para renderizar o HTML do conteúdo da notícia */}
            <div dangerouslySetInnerHTML={{ __html: article.content }} />

            <div style={{textAlign: 'center', marginTop: '3rem'}}>
              <Link to="/" className="download-button">← Voltar ao Portal</Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

export default NewsArticlePage;