// frontend/src/pages/TopUpPage.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import UserPanel from '../components/UserPanel';
import LoginForm from '../components/LoginForm';

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

function TopUpPage() {
    const { user, token } = useAuth();
    const [rates, setRates] = useState(null);
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [cashAmount, setCashAmount] = useState('');
    const [isPageEnabled, setIsPageEnabled] = useState(true);

    useEffect(() => {
        const fetchPageData = async () => {
            setLoading(true);
            try {
                const ratesResponse = await api.get('/rates');
                setRates(ratesResponse.data);

                const rankingResponse = await api.get('/homepage');
                setRanking(rankingResponse.data.ranking);

            } catch (error) {
                console.error("Erro ao buscar dados da página:", error);
            } finally {
                setLoading(false);
            }
        };
        const fetchSettings = async () => {
            try {
                const response = await api.get('/admin/settings');
                setIsPageEnabled(response.data.isTopUpEnabled === 'true');
            } catch (error) {
                console.error("Erro ao buscar configurações:", error);
            }
        };

        fetchSettings();
        fetchPageData();
    }, []);

    const calculateBrlCost = () => {
        if (!rates || !cashAmount || !rates.BRL_TO_CASH_RATE) return "0.00";
        return (parseFloat(cashAmount) / rates.BRL_TO_CASH_RATE).toFixed(2);
    };

    const handleCashPurchase = async () => {
        if (!cashAmount || parseFloat(cashAmount) <= 0) {
            alert("Por favor, insira uma quantidade de CASH válida.");
            return;
        }
        setProcessing(true);
        try {
            const response = await api.post(
                '/payments/create-mercado-pago-order', 
                { cashAmount: parseFloat(cashAmount) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const { init_point } = response.data;
            if (init_point) {
                window.location.href = init_point;
            } else {
                throw new Error("Link de pagamento não recebido.");
            }
        } catch (error) {
            console.error("Erro ao criar pedido no Mercado Pago:", error);
            alert(`Erro: ${error.response?.data?.message || "Não foi possível iniciar o pagamento."}`);
            setProcessing(false);
        }
    };

    if (!isPageEnabled) {
        return <div className="container"><p className="message error">Esta página está desativada.</p></div>;
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h1>Top-Up de Moedas</h1>
                            <WalletMultiButton />
                        </div>

                        {loading ? <p>Carregando...</p> : (
                            !user ? (
                                <div style={{textAlign: 'center'}}>
                                    <p>Você precisa estar logado para comprar moedas.</p>
                                </div>
                            ) : (
                                <div className="topup-container" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', justifyItems: 'center' }}>
                                    <div className="purchase-box" style={{ padding: '2rem', backgroundColor: '#2a2a2a', borderRadius: '8px', maxWidth: '500px', width: '100%' }}>
                                        <h2>Comprar CASH</h2>
                                        <p style={{ marginBottom: '1rem' }}>Cotação atual: <strong>{rates?.BRL_TO_CASH_RATE.toLocaleString('pt-BR')} CASH</strong> por 1 BRL</p>
                                        
                                        <div className="form-group">
                                            <label>Quantidade de CASH desejada:</label>
                                            <input
                                                type="number"
                                                value={cashAmount}
                                                onChange={(e) => setCashAmount(e.target.value)}
                                                placeholder="Ex: 100000"
                                                disabled={processing}
                                            />
                                        </div>
                                        
                                        <p>Custo: <strong style={{color: '#27ae60', fontSize: '1.2em'}}>R$ {calculateBrlCost()}</strong></p>

                                        <button 
                                            onClick={handleCashPurchase} 
                                            className="buy-button-logged-in" 
                                            style={{marginTop: '1rem', backgroundColor: '#3498db'}}
                                            disabled={processing}
                                        >
                                            {processing ? 'Processando...' : 'Pagar com Mercado Pago'}
                                        </button>
                                    </div>
                                </div>
                            )
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

export default TopUpPage;