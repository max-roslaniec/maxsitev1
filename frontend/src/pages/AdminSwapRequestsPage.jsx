// frontend/src/pages/AdminSwapRequestsPage.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import styles from '../admin.module.css';

function AdminSwapRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [totalRequests, setTotalRequests] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [limit, setLimit] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Pendente');
    const [typeFilter, setTypeFilter] = useState('Todos'); // Novo filtro

    const { accessToken } = useAuth(); // Alterado de 'token' para 'accessToken'

    const fetchRequests = async () => {
        setLoading(true);
        try {
            // CORREÇÃO: Header de autorização removido e filtro de tipo adicionado
            const response = await api.get(`/admin/swaps?page=${currentPage}&limit=${limit}&search=${activeSearch}&status=${statusFilter}&type=${typeFilter}`);
            setRequests(response.data.requests);
            setTotalRequests(response.data.totalRequests);
            setTotalPages(response.data.totalPages);
            setError('');
        } catch (err) {
            setError('Não foi possível carregar as solicitações.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accessToken) {
            fetchRequests();
        }
    }, [accessToken, currentPage, limit, activeSearch, statusFilter, typeFilter]);

    const handleUpdateStatus = async (requestId, newStatus) => {
        const confirmationText = newStatus === 'Concluído' 
            ? `Tem certeza que deseja marcar o pedido #${requestId} como 'Concluído'?`
            : `Tem certeza que deseja alterar o status do pedido #${requestId} para '${newStatus}'?`;

        if (window.confirm(confirmationText)) {
            try {
                // CORREÇÃO: Header de autorização removido
                await api.patch(`/admin/swaps/${requestId}/status`, { status: newStatus });
                fetchRequests();
            } catch (err) {
                alert('Ocorreu um erro ao atualizar a solicitação.');
                console.error(err);
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

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Copiado para a área de transferência!');
        });
    };

    if (error) return <p className="message error">{error}</p>;

    return (
        <div>
            <div className={styles.listHeader}>
                <h1>Gerenciar Solicitações de SWAP ({totalRequests})</h1>
            </div>

            <div style={{ display: 'flex', gap: '20px', margin: '1rem 0', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                    <span>Status: </span>
                    <select value={statusFilter} onChange={e => { setCurrentPage(1); setStatusFilter(e.target.value); }}>
                        <option value="Pendente">Pendentes</option>
                        <option value="Concluído">Concluídos</option>
                        <option value="Rejeitado">Rejeitados</option>
                        <option value="Todos">Todos</option>
                    </select>
                </div>
                <div>
                    <span>Tipo: </span>
                    <select value={typeFilter} onChange={e => { setCurrentPage(1); setTypeFilter(e.target.value); }}>
                        <option value="Todos">Todos</option>
                        <option value="gold_to_gcash">GOLD ➔ GCASH</option>
                        <option value="gcash_to_brl">GCASH ➔ BRL</option>
                    </select>
                </div>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flexGrow: '1' }}>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por ID, Jogador, Carteira ou PIX..."
                        style={{ flexGrow: '1', padding: '10px' }}
                    />
                    <button type="submit" className={styles.actionBtn} style={{backgroundColor: '#3498db'}}>Buscar</button>
                    <button type="button" onClick={handleClearSearch} className={styles.actionBtn} style={{backgroundColor: '#7f8c8d'}}>Limpar</button>
                </form>
            </div>

            {loading ? <p>Carregando solicitações...</p> : (
                <>
                    <table className={styles.adminTable}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Jogador</th>
                                <th>Data</th>
                                <th>Tipo</th>
                                <th>Detalhes da Troca</th>
                                <th>Destino</th>
                                <th>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length > 0 ? requests.map(req => (
                                <tr key={req.id}>
                                    <td>{req.id}</td>
                                    <td>{req.NickName} ({req.user_id})</td>
                                    <td>{new Date(req.created_at).toLocaleString('pt-BR')}</td>
                                    <td>
                                        {req.type === 'gold_to_gcash' && <span style={{color: '#f1c40f', fontWeight: 'bold'}}>GOLD ➔ GCASH</span>}
                                        {req.type === 'gcash_to_brl' && <span style={{color: '#2ecc71', fontWeight: 'bold'}}>GCASH ➔ BRL</span>}
                                    </td>
                                    <td>
                                        {req.type === 'gold_to_gcash' && (
                                            <div>
                                                <p><strong>Gold Trocado:</strong> {req.gold_amount?.toLocaleString('pt-BR')}</p>
                                                <p><strong>GCash a Enviar:</strong> {req.gcash_amount?.toLocaleString('pt-BR')}</p>
                                            </div>
                                        )}
                                        {req.type === 'gcash_to_brl' && (
                                            <div>
                                                <p><strong>GCash Trocado:</strong> {req.gcash_amount_brl?.toLocaleString('pt-BR')}</p>
                                                <p><strong>BRL a Enviar:</strong> R$ {req.brl_amount}</p>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {req.type === 'gold_to_gcash' && (
                                            <div style={{fontFamily: 'monospace', fontSize: '0.9em'}}>
                                                {req.solana_wallet}
                                                <button onClick={() => copyToClipboard(req.solana_wallet)} style={{padding: '2px 6px', marginLeft: '10px'}}>Copiar</button>
                                            </div>
                                        )}
                                        {req.type === 'gcash_to_brl' && (
                                            <div style={{fontFamily: 'monospace', fontSize: '0.9em'}}>
                                                {req.pix_key}
                                                <button onClick={() => copyToClipboard(req.pix_key)} style={{padding: '2px 6px', marginLeft: '10px'}}>Copiar</button>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {req.status === 'Pendente' && (
                                            <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                                                <button
                                                    onClick={() => handleUpdateStatus(req.id, 'Concluído')}
                                                    className={`${styles.actionBtn} ${styles.addBtn}`}
                                                >
                                                    Marcar Concluído
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(req.id, 'Rejeitado')}
                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                >
                                                    Rejeitar
                                                </button>
                                            </div>
                                        )}
                                        {req.status !== 'Pendente' && req.status}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center' }}>Nenhuma solicitação encontrada com os filtros atuais.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                        <div>
                            <span>Itens por página: </span>
                            <select value={limit} onChange={e => { setCurrentPage(1); setLimit(Number(e.target.value)); }}>
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

export default AdminSwapRequestsPage;