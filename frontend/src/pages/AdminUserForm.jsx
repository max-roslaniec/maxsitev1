// frontend/src/pages/AdminUserForm.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import styles from '../admin.module.css';

function AdminUserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  
  const [userData, setUserData] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [newItemId, setNewItemId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [itemMessage, setItemMessage] = useState({ text: '', type: '' });

  const fetchData = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      // CORREÇÃO: Headers removidos. O interceptor cuida da autenticação.
      const [userResponse, inventoryResponse] = await Promise.all([
        api.get(`/admin/users/${id}`),
        api.get(`/admin/users/${id}/inventory`)
      ]);
      setUserData(userResponse.data);
      setInventory(inventoryResponse.data);
    } catch (err) {
      setError('Não foi possível carregar os dados completos do usuário.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, accessToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // CORREÇÃO: Header removido.
      await api.put(`/admin/users/${id}`, userData);
      alert('Usuário atualizado com sucesso!');
      navigate('/admin/users');
    } catch (err) {
      alert('Erro ao atualizar o usuário.');
    }
  };

  const handleAddItem = async () => {
    if (!newItemId.trim()) return;
    setItemMessage({ text: '', type: '' });
    try {
      // CORREÇÃO: Header removido.
      const response = await api.post('/admin/inventory/add', { userId: id, itemId: newItemId });
      
      setItemMessage({ text: response.data.message, type: 'success' });
      setNewItemId('');
      fetchData();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Ocorreu um erro desconhecido.';
      setItemMessage({ text: errorMessage, type: 'error' });
    } finally {
        setTimeout(() => {
            setItemMessage({ text: '', type: '' });
        }, 5000);
    }
  };

  const handleDeleteItem = async (itemNo) => {
    if (window.confirm(`Tem certeza que deseja remover este item do inventário?`)) {
      try {
        // CORREÇÃO: Header removido.
        await api.delete(`/admin/inventory/${itemNo}`);
        fetchData();
      } catch (err) {
        alert('Erro ao remover o item.');
      }
    }
  };

  if (loading) return <p>Carregando dados completos do usuário...</p>;
  if (error) return <p className={`${styles.message} ${styles.error}`}>{error}</p>;
  if (!userData) return <p>Nenhum dado de usuário para exibir.</p>;

  return (
    <div>
      <h1>Editar Usuário: {userData.Id}</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.adminFormContainer}>
            <div className={styles.formGroup}><label>Nickname</label><input type="text" name="NickName" value={userData.NickName || ''} onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>Senha (deixe em branco para não alterar)</label><input type="password" name="Password" placeholder="Nova senha..." onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>Status</label><select name="Status" value={userData.Status} onChange={handleChange}><option value="1">Ativo</option><option value="0">Inativo</option></select></div>
            <div className={styles.formGroup}>
                <label>Autoridade</label>
                <select name="Authority" value={userData.Authority} onChange={handleChange}>
                    <option value="1">Normal</option>
                    <option value="99">GM</option>
                    <option value="100">Admin</option>
                </select>
            </div>
            <div className={styles.formGroup}><label>Gold</label><input type="number" name="Money" value={userData.Money} onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>GP</label><input type="number" name="TotalScore" value={userData.TotalScore} onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>Cash</label><input type="number" name="Cash" value={userData.Cash} onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>Nível</label><input type="number" name="TotalGrade" value={userData.TotalGrade} onChange={handleChange} /></div>

            <div className={styles.inventorySection}>
                <h2>Inventário do Jogador</h2>
                <div className={styles.addItemForm}>
                  <input 
                    type="number" 
                    placeholder="ID do Item para adicionar" 
                    value={newItemId}
                    onChange={(e) => setNewItemId(e.target.value)}
                  />
                  <button type="button" onClick={handleAddItem} className={`${styles.actionBtn} ${styles.addBtn}`}>
                    Adicionar Item
                  </button>
                </div>
                {itemMessage.text && (
                  <div className={`message ${itemMessage.type === 'success' ? 'success' : 'error'}`} style={{ marginTop: '1rem', textAlign: 'center' }}>
                    {itemMessage.text}
                  </div>
                )}
                <table className={styles.adminTable} style={{marginTop: '1rem'}}>
                  <thead>
                    <tr><th>ID do Item</th><th>Nome</th><th>Tipo</th><th>Gênero</th><th>Ação</th></tr>
                  </thead>
                  <tbody>
                    {inventory.length > 0 ? inventory.map(item => (
                      <tr key={item.No}>
                        <td>{item.itemId}</td><td>{item.name}</td><td>{item.type}</td><td>{item.gender}</td>
                        <td>
                          <button type="button" onClick={() => handleDeleteItem(item.No)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                            Remover
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" style={{textAlign: 'center'}}>Este jogador não possui itens.</td></tr>
                    )}
                  </tbody>
                </table>
            </div>
        </div>
        <div style={{textAlign: 'center', marginTop: '2rem'}}>
            <button type="submit" className={styles.buttonSave}>Salvar Alterações do Usuário</button>
        </div>
      </form>
      <div className={styles.footerLink}>
          <Link to="/admin/users">Voltar para a Lista de Usuários</Link>
      </div>
    </div>
  );
}

export default AdminUserForm;