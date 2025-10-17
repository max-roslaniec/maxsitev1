// frontend/src/pages/AdminGuildRequestsPage.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import styles from '../admin.module.css';

function AdminGuildRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('Pendente'); // Filtro inicial
    const { accessToken } = useAuth();

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/guilds/creation-requests?status=${statusFilter}`);
            setRequests(response.data);
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
    }, [accessToken, statusFilter]); // Recarrega quando o filtro de status muda

    const handleApprove = async (requestId) => {
        if (window.confirm(`Tem certeza que deseja APROVAR a criação desta guilda?`)) {
            try {
                const response = await api.post(`/admin/guilds/creation-requests/${requestId}/approve`);
                alert(response.data.message);
                fetchRequests(); // Atualiza a lista
            } catch (err) {
                alert(`Erro: ${err.response?.data?.message || 'Falha ao aprovar.'}`);
            }
        }
    };

    const handleReject = async (requestId) => {
        const reason = window.prompt("Por favor, digite o motivo da reprovação (obrigatório):");
        if (reason && reason.trim() !== '') {
            try {
                const response = await api.post(`/admin/guilds/creation-requests/${requestId}/reject`, { reason });
                alert(response.data.message);
                fetchRequests(); // Atualiza a lista
            } catch (err) {
                alert(`Erro: ${err.response?.data?.message || 'Falha ao reprovar.'}`);
            }
        } else if (reason !== null) { // Se o usuário não cancelou, mas deixou em branco
            alert("O motivo da reprovação não pode ser vazio.");
        }
    };

    if (error) return <p className="message error">{error}</p>;

    return (
        <div>
            <div className={styles.listHeader}>
                <h1>Aprovar Criação de Guilds</h1>
            </div>

            {/* Filtro de Status */}
            <div style={{ margin: '1rem 0' }}>
                <span>Filtrar por Status: </span>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="Pendente">Pendentes</option>
                    <option value="Aprovado">Aprovadas</option>
                    <option value="Reprovado">Reprovadas</option>
                </select>
            </div>

            {loading ? <p>Carregando solicitações...</p> : (
                <table className={styles.adminTable}>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Jogador</th>
                            <th>Nome da Guild</th>
                            <th>Descrição</th>
                            <th>Imagem</th>
                            <th>Discord</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length > 0 ? requests.map(req => (
                            <tr key={req.id}>
                                <td>{new Date(req.created_at).toLocaleString('pt-BR')}</td>
                                <td>{req.NickName} ({req.user_id})</td>
                                <td>{req.guild_name}</td>
                                <td style={{maxWidth: '200px'}}>{req.guild_description}</td>
                                <td>
                                    {req.guild_image_url ? (
                                        <a href={`http://localhost:3001/images/guilds/${req.guild_image_url}`} target="_blank" rel="noopener noreferrer">Ver Imagem</a>
                                    ) : 'N/A'}
                                </td>
                                <td>
                                    {req.discord_url ? (
                                        <a href={req.discord_url} target="_blank" rel="noopener noreferrer">Link</a>
                                    ) : 'N/A'}
                                </td>
                                <td>
                                    {req.status === 'Pendente' && (
                                        <div style={{display: 'flex', gap: '5px'}}>
                                            <button onClick={() => handleApprove(req.id)} className={`${styles.actionBtn} ${styles.addBtn}`}>Aprovar</button>
                                            <button onClick={() => handleReject(req.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Reprovar</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center' }}>Nenhuma solicitação encontrada com o status "{statusFilter}".</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AdminGuildRequestsPage;