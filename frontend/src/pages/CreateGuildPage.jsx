// frontend/src/pages/CreateGuildPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import UserPanel from '../components/UserPanel';
import LoginForm from '../components/LoginForm';

const MySwal = withReactContent(Swal);

const GUILD_CREATION_FEE = 100000;
const POWER_USER_ITEM_ID = 204801;

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

function CreateGuildPage() {
    const { user, userData, accessToken } = useAuth();
    const navigate = useNavigate();

    const [hasPowerUser, setHasPowerUser] = useState(false);
    const [hasEnoughGold, setHasEnoughGold] = useState(false);
    const [isEligible, setIsEligible] = useState(false);
    const [loadingCheck, setLoadingCheck] = useState(true);
    const [ranking, setRanking] = useState([]);

    const [guildName, setGuildName] = useState('');
    const [description, setDescription] = useState('');
    const [discordLink, setDiscordLink] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const checkPrerequisites = async () => {
            if (user && accessToken && userData) {
                const goldCheck = userData.Money >= GUILD_CREATION_FEE;
                setHasEnoughGold(goldCheck);

                try {
                    // The inventory is already in userData, no need for a new API call
                    const inventory = new Set(userData.inventory.map(id => Number(id)));
                    const puCheck = inventory.has(POWER_USER_ITEM_ID);
                    setHasPowerUser(puCheck);
                    setIsEligible(goldCheck && puCheck);

                    // Fetch ranking data separately
                    const rankingResponse = await api.get('/homepage');
                    setRanking(rankingResponse.data.ranking);

                } catch (err) {
                    console.error("Erro ao verificar pré-requisitos", err);
                    setError("Não foi possível verificar seus pré-requisitos.");
                }
            }
            setLoadingCheck(false);
        };
        checkPrerequisites();
    }, [user, accessToken, userData]);


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 150 * 1024) {
            MySwal.fire('Erro no Upload', 'A imagem é muito grande. O tamanho máximo é 150KB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                if (img.width > 235 || img.height > 105) {
                    MySwal.fire('Erro no Upload', 'A resolução da imagem é muito grande. O máximo é 235x105 pixels.', 'error');
                } else {
                    setError('');
                    setImageFile(file);
                    setImagePreview(event.target.result);
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!isEligible) {
            MySwal.fire({
                title: 'Requisitos Não Cumpridos',
                icon: 'info',
                html: `
                    <div style="text-align: left; display: inline-block;">
                        <p style="margin-bottom: 1.5rem;">Você precisa cumprir os seguintes requisitos para criar uma guilda:</p>
                        <ul style="list-style: none; padding: 0;">
                            <li style="display: flex; align-items: center; margin-bottom: 1rem; font-size: 1.1em;">
                                <span style="font-size: 1.5em; margin-right: 1rem;">${hasEnoughGold ? '✔️' : '❌'}</span>
                                <div>
                                    Ter ${GUILD_CREATION_FEE.toLocaleString('pt-BR')} de Gold
                                    <small style="display: block; font-size: 0.8em; color: #999; font-style: italic;">Você tem: ${userData?.Money.toLocaleString('pt-BR')}</small>
                                </div>
                            </li>
                            <li style="display: flex; align-items: center; font-size: 1.1em;">
                                <span style="font-size: 1.5em; margin-right: 1rem;">${hasPowerUser ? '✔️' : '❌'}</span>
                                <div>
                                    Ter um Power User
                                    <small style="display: block; font-size: 0.8em; color: #999; font-style: italic;">Este item deve estar no seu inventário.</small>
                                </div>
                            </li>
                        </ul>
                    </div>
                `,
                confirmButtonText: 'Entendi'
            });
            return;
        }
        
        const result = await MySwal.fire({
            title: 'Confirmar Criação',
            html: `
                <p>Você tem certeza que deseja enviar esta solicitação?</p>
                <p>A taxa de <strong>${GUILD_CREATION_FEE.toLocaleString('pt-BR')} GOLD</strong> será debitada <strong>IMEDIATAMENTE</strong> e não será reembolsada em caso de reprovação.</p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, criar guilda!',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('guild_name', guildName);
        formData.append('guild_description', description);
        formData.append('discord_url', discordLink);
        if (imageFile) {
            formData.append('guild_image', imageFile);
        }

        try {
            const response = await api.post('/guilds/create-request', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccessMessage(response.data.message);
            MySwal.fire('Sucesso!', response.data.message, 'success');
            setGuildName('');
            setDescription('');
            setDiscordLink('');
            setImageFile(null);
            setImagePreview('');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Ocorreu um erro ao enviar a solicitação.';
            setError(errorMessage);
            MySwal.fire('Erro!', errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loadingCheck) return <div className="container"><p>Verificando seus requisitos...</p></div>;

    if (!user) {
        return (
            <div className="container" style={{textAlign: 'center'}}>
                <h1>Criar Guild</h1>
                <p>Você precisa estar logado para criar uma guilda.</p>
            </div>
        );
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
                        <h1>Criar Guild</h1>

                        <div className="swap-form-container" style={{ padding: '2rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
                            <div className="message error" style={{border: '1px solid #e74c3c', padding: '1rem', marginBottom: '1.5rem'}}>
                                <p><strong>ATENÇÃO:</strong> A taxa de 100.000 Gold será debitada no momento da solicitação e não será reembolsada caso sua guilda seja reprovada.</p>
                                <p>Qualquer nome, descrição ou imagem com conteúdo impróprio (ofensivo, adulto, etc.), ou que tente se passar pela administração do jogo, resultará na reprovação imediata, perda dos fundos e possível banimento da conta.</p>
                                <p>O clã só permanecerá ativo enquanto o líder tiver Power User. Caso expire, a liderança será transferida para o próximo membro mais antigo com Power User ativo.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="hightech-form">
                                <div className="form-group">
                                    <label>Nome da Guild (Obrigatório, 3-8 caracteres)</label>
                                    <input type="text" value={guildName} onChange={e => setGuildName(e.target.value)} required minLength="3" maxLength="8" />
                                </div>
                                <div className="form-group">
                                    <label>Descrição (Obrigatório, máx. 100 caracteres)</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)} required maxLength="100" style={{ height: '80px', resize: 'vertical' }} />
                                </div>
                                <div className="form-group">
                                    <label>Link do Discord (Opcional)</label>
                                    <input type="text" value={discordLink} onChange={e => setDiscordLink(e.target.value)} placeholder="https://discord.gg/seuconvite" />
                                </div>
                                <div className="form-group">
                                    <label>Imagem da Guild (Opcional, máx. 235x105, 150KB)</label>
                                    <input type="file" accept="image/png, image/jpeg, image/gif" onChange={handleImageChange} />
                                    {imagePreview && <img src={imagePreview} alt="Prévia" style={{ maxWidth: '235px', marginTop: '10px', border: '1px solid #444' }} />}
                                </div>

                                {error && <p className="message error" style={{display: 'none'}}>{error}</p>}
                                {successMessage && <p className="message success" style={{display: 'none'}}>{successMessage}</p>}

                                <button 
                                    type="submit" 
                                    className="buy-button-logged-in" 
                                    style={{ marginTop: '1rem', cursor: isSubmitting || !isEligible ? 'not-allowed' : 'pointer' }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Enviando Solicitação...' : `Pagar ${GUILD_CREATION_FEE.toLocaleString('pt-BR')} de Gold e Enviar`}
                                </button>
                            </form>
                        </div>
                    </main>
                    <aside className="sidebar-right">
                        { user ? <UserPanel /> : <LoginForm /> }
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default CreateGuildPage;