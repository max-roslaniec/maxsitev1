// frontend/src/pages/AdminUsersPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import styles from '../admin.module.css';

function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [searchedUser, setSearchedUser] = useState(null);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [limit, setLimit] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    
    const { accessToken } = useAuth(); // Usamos accessToken para o dependency array do useEffect
    const navigate = useNavigate();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // CORREÇÃO: Header de autorização removido. O interceptor cuidará disso.
            const response = await api.get(`/admin/users?page=${currentPage}&limit=${limit}&search=${activeSearch}`);
            
            setUsers(response.data.users);
            setSearchedUser(response.data.searchedUser);
            setTotalUsers(response.data.totalUsers);
            setTotalPages(response.data.totalPages);
            setError('');
        } catch (err) {
            setError('Não foi possível carregar os usuários.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // A presença do accessToken é um bom gatilho para buscar os dados
        if (accessToken) {
            fetchUsers();
        }
    }, [accessToken, currentPage, limit, activeSearch]);

    const handleDelete = async (userId) => {
        if (window.confirm(`Tem certeza que deseja DELETAR PERMANENTEMENTE o usuário ${userId}?`)) {
            try {
                // CORREÇÃO: Header de autorização removido também aqui.
                await api.delete(`/admin/users/${userId}`);
                fetchUsers();
            } catch (err) {
                alert('Erro ao deletar o usuário.');
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
                <h1>Gerenciar Usuários ({totalUsers})</h1>
            </div>

            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', margin: '1rem 0' }}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por ID de Login ou Nickname..."
                    style={{ flexGrow: '1', padding: '10px' }}
                />
                <button type="submit" className={styles.actionBtn} style={{backgroundColor: '#3498db'}}>Buscar</button>
                <button type="button" onClick={handleClearSearch} className={styles.actionBtn} style={{backgroundColor: '#7f8c8d'}}>Limpar</button>
            </form>

            {searchedUser && (
                <>
                    <h2 style={{marginTop: '2rem'}}>Resultado da Busca</h2>
                    <table className={styles.adminTable}>
                        <thead>
                            <tr>
                                <th>ID de Login</th>
                                <th>Nickname</th>
                                <th>Status</th>
                                <th>Autoridade</th>
                                <th colSpan="2">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{backgroundColor: '#34495e'}}>
                                <td>{searchedUser.Id}</td>
                                <td>{searchedUser.NickName}</td>
                                <td>{searchedUser.Status == 1 ? 'Ativo' : 'Inativo'}</td>
                                <td>{searchedUser.Authority == 100 ? 'Admin' : (searchedUser.Authority == 99 ? 'GM' : 'Normal')}</td>
                                <td>
                                    <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => navigate(`/admin/users/edit/${searchedUser.Id}`)}>Editar</button>
                                </td>
                                <td>
                                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(searchedUser.Id)}>Excluir</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </>
            )}

            <h2 style={{marginTop: '2rem'}}>Lista de Usuários</h2>
            {loading ? <p>Carregando...</p> : (
                <>
                    <table className={styles.adminTable}>
                        <thead>
                            <tr>
                                <th>ID de Login</th>
                                <th>Nickname</th>
                                <th>Status</th>
                                <th>Autoridade</th>
                                <th colSpan="2">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.Id}>
                                    <td>{user.Id}</td>
                                    <td>{user.NickName}</td>
                                    <td>{user.Status == 1 ? 'Ativo' : 'Inativo'}</td>
                                    <td>{user.Authority == 100 ? 'Admin' : (user.Authority == 99 ? 'GM' : 'Normal')}</td>
                                    <td>
                                        <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => navigate(`/admin/users/edit/${user.Id}`)}>Editar</button>
                                    </td>
                                    <td>
                                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(user.Id)}>Excluir</button>
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
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} style={{marginLeft: '10px'}}>
                                &laquo; Anterior
                            </button>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                                Próxima &raquo;
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default AdminUsersPage;