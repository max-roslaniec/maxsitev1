// frontend/src/pages/AdminNewsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import styles from '../admin.module.css';

function AdminNewsPage() {
    const [news, setNews] = useState([]);
    const [totalNews, setTotalNews] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [limit, setLimit] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearch, setActiveSearch] = useState('');

    const { accessToken } = useAuth();
    const navigate = useNavigate();

    const fetchNews = async () => {
        setLoading(true);
        try {
            // CORREÇÃO: Header de autorização removido. O interceptor cuidará disso.
            const response = await api.get(`/admin/news?page=${currentPage}&limit=${limit}&search=${activeSearch}`);
            
            setNews(response.data.news);
            setTotalNews(response.data.totalNews);
            setTotalPages(response.data.totalPages);
            setError('');
        } catch (err)
        {
            setError('Não foi possível carregar as notícias.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accessToken) {
            fetchNews();
        }
    }, [accessToken, currentPage, limit, activeSearch]);

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja apagar esta notícia?')) {
            try {
                // CORREÇÃO: Header de autorização removido também aqui.
                await api.delete(`/admin/news/${id}`);
                fetchNews();
            } catch (err) {
                alert('Ocorreu um erro ao deletar a notícia.');
            }
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        setActiveSearch(searchTerm);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setActiveSearch('');
        setCurrentPage(1);
    };

    const handleLimitChange = (e) => {
        setLimit(Number(e.target.value));
        setCurrentPage(1);
    };

    if (error) return <p className="message error">{error}</p>;

    return (
        <div>
            <div className={styles.listHeader}>
                <h1>Gerenciar Notícias ({totalNews})</h1>
                <button onClick={() => navigate('/admin/news/new')} className={`${styles.actionBtn} ${styles.addBtn}`}>
                    Criar Nova Notícia
                </button>
            </div>

            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', margin: '1rem 0' }}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por título..."
                    style={{ flexGrow: '1', padding: '10px' }}
                />
                <button type="submit" className={styles.actionBtn} style={{backgroundColor: '#3498db'}}>Buscar</button>
                <button type="button" onClick={handleClearSearch} className={styles.actionBtn} style={{backgroundColor: '#7f8c8d'}}>Limpar</button>
            </form>

            {loading ? <p>Carregando notícias...</p> : (
                <>
                    <table className={styles.adminTable}>
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Autor</th>
                                <th>Data</th>
                                <th colSpan="2">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {news.length > 0 ? news.map(article => (
                                <tr key={article.id}>
                                    <td>{article.title}</td>
                                    <td>{article.author}</td>
                                    <td>{new Date(article.created_at).toLocaleDateString('pt-BR')}</td>
                                    <td>
                                        <button onClick={() => navigate(`/admin/news/edit/${article.id}`)} className={`${styles.actionBtn} ${styles.editBtn}`}>
                                            Editar
                                        </button>
                                    </td>
                                    <td>
                                        <button onClick={() => handleDelete(article.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                                            Remover
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center' }}>Nenhuma notícia encontrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                        <div>
                            <span>Itens por página: </span>
                            <select value={limit} onChange={handleLimitChange}>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        <div>
                            <span>Página {currentPage} de {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage <= 1} style={{ marginLeft: '10px' }}>
                                &laquo; Anterior
                            </button>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
                                Próxima &raquo;
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default AdminNewsPage;