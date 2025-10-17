import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import styles from '../admin.module.css';

// Componente para uma única linha de recompensa, agora com upload de imagem
function RewardRow({ reward, index, onRewardChange, onRemoveReward, onRewardImageChange }) {
    return (
        <tr>
            <td data-label="Tipo">
                <select 
                    className={styles.formInput} 
                    value={reward.reward_type || 'ITEM'} 
                    onChange={(e) => onRewardChange(index, 'reward_type', e.target.value)}
                >
                    <option value="ITEM">ITEM</option>
                    <option value="GOLD">GOLD</option>
                    <option value="CASH">CASH</option>
                </select>
            </td>
            <td data-label="Nome">
                <input 
                    className={styles.formInput} 
                    type="text" 
                    placeholder="Nome da Recompensa" 
                    value={reward.reward_name || ''} 
                    onChange={(e) => onRewardChange(index, 'reward_name', e.target.value)} 
                />
            </td>
            <td data-label="ID Item">
                <input 
                    className={styles.formInput} 
                    type="number" 
                    placeholder="ID do Item" 
                    value={reward.reward_ref || ''} 
                    onChange={(e) => onRewardChange(index, 'reward_ref', e.target.value)} 
                    disabled={reward.reward_type !== 'ITEM'}
                />
            </td>
            <td data-label="Valor">
                <input 
                    className={styles.formInput} 
                    type="number" 
                    placeholder="Valor" 
                    value={reward.reward_value || ''} 
                    onChange={(e) => onRewardChange(index, 'reward_value', e.target.value)} 
                    disabled={reward.reward_type === 'ITEM'}
                />
            </td>
            <td data-label="Imagem">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {reward.reward_image && (
                        <img 
                            src={`${import.meta.env.VITE_API_URL}${reward.reward_image}`} 
                            alt="Prévia" 
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} 
                        />
                    )}
                    <input 
                        className={styles.formInput} 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => onRewardImageChange(index, e.target.files[0])} 
                    />
                </div>
            </td>
            <td data-label="Chance (%)">
                <input 
                    className={styles.formInput} 
                    type="number" 
                    placeholder="%" 
                    value={reward.chance || ''} 
                    onChange={(e) => onRewardChange(index, 'chance', e.target.value)} 
                />
            </td>
            <td data-label="Ação">
                <button type="button" onClick={() => onRemoveReward(index)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                    Excluir
                </button>
            </td>
        </tr>
    );
}

function AdminShopForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [itemData, setItemData] = useState({
        itemId: '', name: '', image: '', duration: 'Eterno',
        gender: 'Unissex', type: 'CABEÇA', content: '',
        price_cash: '', price_gcash: ''
    });
    const [rewards, setRewards] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isEditing) {
            const fetchItem = async () => {
                setLoading(true);
                try {
                    const response = await api.get(`/admin/shop/${id}`);
                    const { rewards: fetchedRewards, ...fetchedItemData } = response.data;
                    setItemData(fetchedItemData);
                    setRewards(fetchedRewards || []);

                    if (fetchedItemData.image) {
                        setPreview(`${import.meta.env.VITE_API_URL}/images/avatars/${fetchedItemData.image}`);
                    }
                } catch (err) {
                    setError('Não foi possível carregar o item.');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchItem();
        } else {
            setLoading(false);
        }
    }, [id, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setItemData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleRewardChange = (index, field, value) => {
        const updatedRewards = rewards.map((reward, i) => {
            if (i === index) {
                return { ...reward, [field]: value };
            }
            return reward;
        });
        setRewards(updatedRewards);
    };

    const handleRewardImageUpload = async (index, file) => {
        if (!file) return;

        const formData = new FormData();
        formData.append('rewardImage', file);

        try {
            const response = await api.post('/admin/shop/upload-reward-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // O backend retorna a URL relativa, ex: /images/gacha_rewards/image.png
            handleRewardChange(index, 'reward_image', response.data.imageUrl);
        } catch (err) {
            console.error("Erro ao fazer upload da imagem da recompensa:", err);
            alert('Falha no upload da imagem da recompensa.');
        }
    };

    const addReward = () => {
        setRewards([...rewards, { reward_type: 'ITEM', reward_name: '', reward_ref: '', reward_value: '', reward_image: '', chance: '' }]);
    };

    const removeReward = (index) => {
        setRewards(rewards.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        
        for (const key in itemData) {
            formData.append(key, itemData[key] ?? '');
        }

        if (imageFile) {
            formData.append('imageFile', imageFile);
        }
        
        if (itemData.type === 'GACHA') {
            formData.append('rewards', JSON.stringify(rewards));
        }

        try {
            const apiCall = isEditing ? api.put : api.post;
            const url = isEditing ? `/admin/shop/${id}` : '/admin/shop';
            
            await apiCall(url, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            navigate('/admin/shop');
        } catch (err) {
            console.error("Erro ao salvar o item:", err);
            alert(`Erro ao salvar o item: ${err.response?.data?.message || err.message}`);
        }
    };

    if (loading) return <p>Carregando...</p>;
    if (error) return <p className={`${styles.message} ${styles.error}`}>{error}</p>;

    return (
        <div>
            <h1>{isEditing ? `Editar Item: ${itemData.name}` : 'Adicionar Novo Item'}</h1>
            <form onSubmit={handleSubmit} className={styles.adminFormContainer}>
                {/* Campos principais do formulário */}
                <div className={styles.formGroup}><label>ID do Item</label><input className={styles.formInput} type="number" name="itemId" value={itemData.itemId} onChange={handleChange} required disabled={isEditing} /></div>
                <div className={styles.formGroup}><label>Nome do Avatar</label><input className={styles.formInput} type="text" name="name" value={itemData.name} onChange={handleChange} required /></div>
                <div className={styles.formGroup}><label>Preço (CASH)</label><input className={styles.formInput} type="number" name="price_cash" value={itemData.price_cash || ''} onChange={handleChange} placeholder="Deixe em branco se não aplicável" /></div>
                <div className={styles.formGroup}><label>Preço (GCASH)</label><input className={styles.formInput} type="number" name="price_gcash" value={itemData.price_gcash || ''} onChange={handleChange} placeholder="Deixe em branco se não aplicável" /></div>
                <div className={styles.formGroup}><label>Duração</label><select className={styles.formInput} name="duration" value={itemData.duration || 'Eterno'} onChange={handleChange}><option value="Eterno">Eterno</option><option value="Mensal">Mensal (30 dias)</option></select></div>
                <div className={styles.formGroup}><label>Gênero</label><select className={styles.formInput} name="gender" value={itemData.gender} onChange={handleChange}><option value="Unissex">Unissex</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option></select></div>
                <div className={styles.formGroup}><label>Tipo</label><select className={styles.formInput} name="type" value={itemData.type} onChange={handleChange}><option value="CABEÇA">CABEÇA</option><option value="CORPO">CORPO</option><option value="ÓCULOS">ÓCULOS</option><option value="BANDEIRA">BANDEIRA</option><option value="EX ITEM">EX ITEM</option><option value="POWER USER">POWER USER</option><option value="GACHA">GACHA</option></select></div>
                <div className={styles.formGroup}><label>Descrição</label><input className={styles.formInput} type="text" name="content" value={itemData.content || ''} onChange={handleChange} /></div>
                <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}><label>Arquivo de Imagem</label><input type="file" accept="image/png, image/jpeg, image/gif" onChange={handleImageChange} />{preview && (<div><p>Prévia:</p><img src={preview} alt="Prévia" style={{maxWidth: '100px'}} /></div>)}</div>

                {/* Seção de Recompensas do Gacha */}
                {itemData.type === 'GACHA' && (
                    <div className={styles.gachaRewardsSection}>
                        <h2>Recompensas do Gacha</h2>
                        <div style={{overflowX: 'auto'}}>
                            <table className={styles.rewardsTable}>
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th>Nome</th>
                                        <th>ID Item</th>
                                        <th>Valor</th>
                                        <th>Imagem</th>
                                        <th>Chance (%)</th>
                                        <th>Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rewards.map((reward, index) => (
                                        <RewardRow 
                                            key={index} 
                                            reward={reward} 
                                            index={index} 
                                            onRewardChange={handleRewardChange} 
                                            onRemoveReward={removeReward}
                                            onRewardImageChange={handleRewardImageUpload} 
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button type="button" onClick={addReward} className={styles.buttonAddReward} style={{marginTop: '1rem'}}>
                            Adicionar Recompensa
                        </button>
                    </div>
                )}

                <button type="submit" className={styles.buttonSave}>Salvar Item</button>
            </form>
        </div>
    );
}

export default AdminShopForm;