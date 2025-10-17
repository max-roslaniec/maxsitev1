// frontend/src/pages/AdminShopPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import styles from '../admin.module.css';

function AdminShopPage() {
    const [items, setItems] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [limit, setLimit] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearch, setActiveSearch] = useState('');

    const { accessToken } = useAuth();
    const navigate = useNavigate();

    const fetchItems = async () => {
        setLoading(true);
        try {
            // CORREÇÃO: Header de autorização removido. O interceptor cuidará disso.
            const response = await api.get(`/admin/shop?page=${currentPage}&limit=${limit}&search=${activeSearch}`);
            
            setItems(response.data.items);
            setTotalItems(response.data.totalItems);
            setTotalPages(response.data.totalPages);
            setError('');
        } catch (err) {
            setError('Não foi possível carregar os itens da loja.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accessToken) {
            fetchItems();
        }
    }, [accessToken, currentPage, limit, activeSearch]);

    const handleDelete = async (itemId, itemName) => {
        if (window.confirm(`Tem certeza que deseja DELETAR o item "${itemName}" (ID: ${itemId})?`)) {
            try {
                // CORREÇÃO: Header de autorização removido também aqui.
                await api.delete(`/admin/shop/${itemId}`);
                fetchItems();
            } catch (err) {
                alert('Erro ao deletar o item.');
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
                <h1>Gerenciar Loja ({totalItems})</h1>
                <button onClick={() => navigate('/admin/shop/new')} className={`${styles.actionBtn} ${styles.addBtn}`}>
                    Adicionar Novo Item
                </button>
            </div>

            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', margin: '1rem 0' }}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por Nome ou ID do Item..."
                    style={{ flexGrow: '1', padding: '10px' }}
                />
                <button type="submit" className={styles.actionBtn} style={{backgroundColor: '#3498db'}}>Buscar</button>
                <button type="button" onClick={handleClearSearch} className={styles.actionBtn} style={{backgroundColor: '#7f8c8d'}}>Limpar</button>
            </form>

            {loading ? <p>Carregando itens...</p> : (
                <>
                    <table className={styles.adminTable}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nome</th>
                                <th>Tipo</th>
                                <th>Preço (CASH)</th>
                                <th>Preço (GCASH)</th>
                                <th colSpan="2">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.itemId}>
                                    <td>{item.itemId}</td>
                                    <td>{item.name}</td>
                                    <td>{item.type}</td>
                                    <td>{item.price_cash !== null ? item.price_cash.toLocaleString('pt-BR') : 'N/A'}</td>
                                    <td>{item.price_gcash !== null ? item.price_gcash.toLocaleString('pt-BR') : 'N/A'}</td>
                                    <td>
                                        <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => navigate(`/admin/shop/edit/${item.itemId}`)}>
                                            Editar
                                        </button>
                                    </td>
                                    <td>
                                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(item.itemId, item.name)}>
                                            Excluir
                                        </button>
                                    </td>
                                </tr>
                            ))}
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
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage <= 1} style={{marginLeft: '10px'}}>
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

export default AdminShopPage;