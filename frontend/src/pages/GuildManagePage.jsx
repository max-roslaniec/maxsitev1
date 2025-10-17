// frontend/src/pages/GuildManagePage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import styles from '../admin.module.css';
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

function GuildManagePage() {
    const { guildId } = useParams();
    const navigate = useNavigate();
    const { user, userData, accessToken, fetchUserData } = useAuth();
    
    const [managementData, setManagementData] = useState(null);
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [description, setDescription] = useState('');
    const [discordLink, setDiscordLink] = useState('');
    const [newName, setNewName] = useState('');
    const [newImageFile, setNewImageFile] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            if (isSubmitting) return;
            setLoading(true);
            const [manageResponse, homeResponse] = await Promise.all([
                api.get('/guilds/manage'),
                api.get('/homepage')
            ]);
            setManagementData(manageResponse.data);
            setDescription(manageResponse.data.guild.description);
            setDiscordLink(manageResponse.data.guild.discord_url || '');
            setRanking(homeResponse.data.ranking);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Não foi possível carregar os dados da página.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accessToken) {
            fetchData();
        }
    }, [accessToken]);

    const handleProcessRequest = async (requestId, action) => {
        const actionText = action === 'accept' ? 'ACEITAR' : 'RECUSAR';
        const result = await MySwal.fire({ title: 'Confirmar Ação', text: `Tem certeza que deseja ${actionText} este pedido?`, icon: 'question', showCancelButton: true, confirmButtonText: 'Sim', cancelButtonText: 'Não' });
        if (!result.isConfirmed) return;

        setIsSubmitting(true);
        try {
            await api.post(`/guilds/manage/requests/${requestId}`, { action });
            await fetchData();
        } catch (err) {
            MySwal.fire('Erro', err.response?.data?.message || 'Não foi possível processar o pedido.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKickMember = async (memberId, memberName) => {
        const result = await MySwal.fire({ title: 'Confirmar Expulsão', text: `Tem certeza que deseja expulsar o membro "${memberName}"?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim, expulsar', cancelButtonText: 'Cancelar', confirmButtonColor: '#d33' });
        if (!result.isConfirmed) return;

        setIsSubmitting(true);
        try {
            const response = await api.post(`/guilds/manage/members/${memberId}/kick`);
            MySwal.fire('Sucesso', response.data.message, 'success');
            await fetchData();
        } catch (err) {
            MySwal.fire('Erro', err.response?.data?.message || 'Não foi possível expulsar o membro.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateRole = async (memberId, newRole) => {
        const actionText = newRole === 'Moderador' ? 'promover para Moderador' : 'rebaixar para Membro';
        const result = await MySwal.fire({ title: 'Confirmar Alteração de Cargo', text: `Tem certeza que deseja ${actionText} este membro?`, icon: 'question', showCancelButton: true, confirmButtonText: 'Sim', cancelButtonText: 'Cancelar' });
        if (!result.isConfirmed) return;

        setIsSubmitting(true);
        try {
            const response = await api.patch(`/guilds/manage/${guildId}/members/${memberId}/role`, { newRole });
            MySwal.fire('Sucesso', response.data.message, 'success');
            await fetchData();
        } catch (err) {
            MySwal.fire('Erro', err.response?.data?.message || 'Não foi possível alterar o cargo.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInfoUpdate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await api.patch(`/guilds/manage/${guildId}/info`, { description, discord_url: discordLink });
            MySwal.fire('Sucesso', response.data.message, 'success');
            await fetchData();
        } catch (err) {
            MySwal.fire('Erro', err.response?.data?.message || 'Falha ao atualizar informações.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChangeName = async (e) => {
        e.preventDefault();
        const result = await MySwal.fire({ title: 'Alterar Nome da Guilda', text: `Alterar o nome da guilda custará 100.000 de Gold e só poderá ser feito novamente em 15 dias. Deseja continuar?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim, continuar', cancelButtonText: 'Cancelar' });
        if (!result.isConfirmed) return;

        setIsSubmitting(true);
        try {
            const response = await api.patch(`/guilds/manage/${guildId}/change-name`, { newName });
            MySwal.fire('Sucesso', response.data.message, 'success');
            setNewName('');
            await fetchData();
            await fetchUserData(accessToken);
        } catch (err) {
            MySwal.fire('Erro', err.response?.data?.message || 'Não foi possível alterar o nome.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChangeImage = async (e) => {
        e.preventDefault();
        if (!newImageFile) {
            MySwal.fire('Atenção', "Por favor, selecione um novo arquivo de imagem.", 'info');
            return;
        }
        const result = await MySwal.fire({ title: 'Alterar Imagem da Guilda', text: `Alterar a imagem da guilda custará 100.000 de Gold e só poderá ser feito novamente em 15 dias. Deseja continuar?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim, continuar', cancelButtonText: 'Cancelar' });
        if (!result.isConfirmed) return;
        
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('guild_image', newImageFile);

        try {
            const response = await api.patch(`/guilds/manage/${guildId}/change-image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            MySwal.fire('Sucesso', response.data.message, 'success');
            setNewImageFile(null);
            e.target.reset();
            await fetchData();
        } catch (err) {
            MySwal.fire('Erro', err.response?.data?.message || 'Não foi possível alterar a imagem.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteGuild = async (e) => {
        e.preventDefault();
        if (deleteConfirmText !== 'EXCLUIR') {
            MySwal.fire('Confirmação Incorreta', 'Você precisa digitar a palavra "EXCLUIR" em letras maiúsculas para confirmar.', 'error');
            return;
        }
        const result = await MySwal.fire({ title: 'ALERTA FINAL!', text: "Esta ação é permanente e não pode ser desfeita. Tem certeza absoluta que deseja deletar a guilda?", icon: 'error', showCancelButton: true, confirmButtonText: 'Sim, DELETAR', cancelButtonText: 'Cancelar', confirmButtonColor: '#d33' });
        if (!result.isConfirmed) return;
        
        setIsSubmitting(true);
        try {
            const response = await api.delete(`/guilds/${guildId}`);
            MySwal.fire('Guild Deletada', response.data.message, 'success').then(() => {
                fetchUserData(accessToken);
                navigate('/guilds');
            });
        } catch (err) {
            MySwal.fire('Erro', err.response?.data?.message || 'Não foi possível deletar a guilda.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="container"><p>Carregando...</p></div>;
    if (error) return <div className="container"><p className="message error">{error}</p></div>;
    if (!managementData) return null;

    const { guild, members, joinRequests } = managementData;
    const isNameChangeAvailable = !guild.name_change_available_at || new Date() > new Date(guild.name_change_available_at);
    const isImageChangeAvailable = !guild.image_change_available_at || new Date() > new Date(guild.image_change_available_at);
    const isLeader = userData?.guild_role === 'Líder';

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
                        <h1>Gerenciamento da Guilda: {guild.name}</h1>
                        
                        <div style={{ marginTop: '2rem' }}>
                            <h2>Pedidos de Entrada Pendentes ({joinRequests.length})</h2>
                            <table className={styles.adminTable}>
                                <thead>
                                    <tr>
                                        <th>Jogador</th>
                                        <th>Nível</th>
                                        <th>Data do Pedido</th>
                                        <th colSpan="2">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {joinRequests.length > 0 ? joinRequests.map(req => (
                                        <tr key={req.id}>
                                            <td>{req.NickName} ({req.user_id})</td>
                                            <td><img src={`/images/ranks/${rankIcons[req.TotalGrade] || 'chick.jpg'}`} alt="Rank Icon" style={{width: '24px'}} /></td>
                                            <td>{new Date(req.created_at).toLocaleString('pt-BR')}</td>
                                            <td><button onClick={() => handleProcessRequest(req.id, 'accept')} className={`${styles.actionBtn} ${styles.addBtn}`} disabled={isSubmitting}>Aceitar</button></td>
                                            <td><button onClick={() => handleProcessRequest(req.id, 'reject')} className={`${styles.actionBtn} ${styles.deleteBtn}`} disabled={isSubmitting}>Recusar</button></td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" style={{ textAlign: 'center' }}>Nenhum pedido de entrada pendente.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <h2>Membros Atuais ({members.length})</h2>
                            <table className={styles.adminTable}>
                                <thead>
                                    <tr>
                                        <th>Nickname</th>
                                        <th>Nível</th>
                                        <th>Cargo</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map(member => (
                                        <tr key={member.Id}>
                                            <td>{member.NickName}</td>
                                            <td><img src={`/images/ranks/${rankIcons[member.TotalGrade] || 'chick.jpg'}`} alt="Rank Icon" style={{width: '24px'}} /></td>
                                            <td>{member.role}</td>
                                            <td>
                                                {isLeader && user && member.Id !== user.Id && (
                                                    <div style={{display: 'flex', gap: '5px'}}>
                                                        {member.role === 'Membro' ? (
                                                            <button onClick={() => handleUpdateRole(member.Id, 'Moderador')} className={`${styles.actionBtn} ${styles.editBtn}`} disabled={isSubmitting}>Promover</button>
                                                        ) : (
                                                            <button onClick={() => handleUpdateRole(member.Id, 'Membro')} className={`${styles.actionBtn}`} style={{backgroundColor: '#7f8c8d'}} disabled={isSubmitting}>Rebaixar</button>
                                                        )}
                                                        <button onClick={() => handleKickMember(member.Id, member.NickName)} className={`${styles.actionBtn} ${styles.deleteBtn}`} disabled={isSubmitting}>Expulsar</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div style={{ marginTop: '3rem', padding: '1.5rem', border: '1px solid #444', borderRadius: '8px' }}>
                            <h2>Editar Informações</h2>
                            <form onSubmit={handleInfoUpdate} className="hightech-form">
                                <div className="form-group">
                                    <label>Descrição (máx. 100 caracteres)</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)} required maxLength="100" style={{ height: '80px' }} disabled={isSubmitting}/>
                                </div>
                                <div className="form-group">
                                    <label>Link do Discord</label>
                                    <input type="text" value={discordLink} onChange={e => setDiscordLink(e.target.value)} placeholder="https://discord.gg/seuconvite" disabled={isSubmitting}/>
                                </div>
                                <button type="submit" className={styles.buttonSave} style={{width: 'auto'}} disabled={isSubmitting}>Salvar Informações</button>
                            </form>
                        </div>

                        {isLeader && (
                            <div style={{ marginTop: '2rem', padding: '1.5rem', border: '2px solid #e74c3c', borderRadius: '8px' }}>
                                <h2 style={{color: '#e74c3c'}}>Zona de Perigo (Apenas Líder)</h2>
                                
                                <div style={{marginTop: '1.5rem'}}>
                                    <h4>Alterar Nome da Guilda (Custo: 100.000 Gold)</h4>
                                    {isNameChangeAvailable ? (
                                        <form onSubmit={handleChangeName} style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required minLength="3" maxLength="8" placeholder="Novo nome..." disabled={isSubmitting}/>
                                            <button type="submit" className={`${styles.actionBtn} ${styles.editBtn}`} disabled={isSubmitting}>Alterar Nome</button>
                                        </form>
                                    ) : (
                                        <p>Você poderá alterar o nome novamente em: {new Date(guild.name_change_available_at).toLocaleDateString('pt-BR')}</p>
                                    )}
                                </div>

                                <div style={{marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #555'}}>
                                    <h4>Alterar Imagem da Guilda (Custo: 100.000 Gold)</h4>
                                    {isImageChangeAvailable ? (
                                        <form onSubmit={handleChangeImage} style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                            <input type="file" accept="image/png, image/jpeg, image/gif" onChange={e => setNewImageFile(e.target.files[0])} required disabled={isSubmitting}/>
                                            <button type="submit" className={`${styles.actionBtn} ${styles.editBtn}`} disabled={isSubmitting}>Alterar Imagem</button>
                                        </form>
                                    ) : (
                                        <p>Você poderá alterar a imagem novamente em: {new Date(guild.image_change_available_at).toLocaleDateString('pt-BR')}</p>
                                    )}
                                </div>

                                <div style={{marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #555'}}>
                                    <h4>Deletar Guilda Permanentemente</h4>
                                    <p>Esta ação é irreversível. A guilda, todos os seus membros e histórico serão removidos.</p>
                                    <form onSubmit={handleDeleteGuild} style={{display: 'flex', gap: '10px', alignItems: 'center', marginTop: '1rem'}}>
                                        <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder='Digite "EXCLUIR" para confirmar' disabled={isSubmitting}/>
                                        <button type="submit" className={`${styles.actionBtn} ${styles.deleteBtn}`} disabled={isSubmitting}>
                                            Deletar Permanentemente
                                        </button>
                                    </form>
                                </div>
                            </div>
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

export default GuildManagePage;