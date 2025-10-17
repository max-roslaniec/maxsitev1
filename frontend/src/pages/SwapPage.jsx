// frontend/src/pages/SwapPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import UserPanel from '../components/UserPanel';
import LoginForm from '../components/LoginForm';

const MySwal = withReactContent(Swal);

// Mock constants - TODO: move to environment variables
const GCASH_MINT_ADDRESS = 'GgrKV3TcrPoDkCrzx9gMFRJgTC1nxNEDtx7NnVJAKPPE';
const TREASURE_WALLET_ADDRESS = 'D1fgz9vCA66EK65ZBY62g7whU5aZ4yQ82aTZL8nfkNfW';
const GCASH_DECIMALS = 9;

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

// =================================================================================
// Componente para o formulário de SWAP de GOLD para GCASH (Lógica Existente)
// =================================================================================
const GoldToGcashSwap = ({ rates, userData, token }) => {
    const [goldAmount, setGoldAmount] = useState('');
    const [solanaWallet, setSolanaWallet] = useState('');
    const [confirmWallet, setConfirmWallet] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const calculatedGcash = () => {
        if (!rates.GOLD_TO_GCASH_RATE || !goldAmount) return 0;
        return Math.floor(parseFloat(goldAmount) / rates.GOLD_TO_GCASH_RATE);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        const amount = parseFloat(goldAmount);

        if (amount < 100000) {
            setError('A quantidade mínima para troca é de 100.000 GOLD.');
            return;
        }
        if ((amount - 100000) % 1000 !== 0) {
            setError('Acima de 100.000, os valores devem ser em incrementos de 1.000 GOLD (ex: 101.000, 102.000).');
            return;
        }
        if (solanaWallet !== confirmWallet) {
            setError("Os endereços da carteira Solana não coincidem.");
            return;
        }
        if (amount > userData.Money) {
            setError("Você não tem GOLD suficiente para esta troca.");
            return;
        }
        if (calculatedGcash() <= 0) {
            setError("A quantidade de GOLD é muito baixa para ser trocada.");
            return;
        }

        const result = await MySwal.fire({
            title: 'Confirmar Troca',
            html: `
                <p>Você tem certeza que deseja trocar <strong>${amount.toLocaleString('pt-BR')} GOLD</strong> por <strong>${calculatedGcash().toLocaleString('pt-BR')} GCASH</strong>?</p>
                <p>O GOLD será <strong>DEBITADO IMEDIATAMENTE</strong> da sua conta.</p>
                <hr />
                <p>Carteira de Destino:<br /><strong>${solanaWallet}</strong></p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, confirmar troca!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const response = await api.post(
                    '/swap/request',
                    { goldAmount: amount, solanaWallet, confirmWallet },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setSuccessMessage(response.data.message);
                MySwal.fire('Sucesso!', response.data.message, 'success');
                setGoldAmount('');
                setSolanaWallet('');
                setConfirmWallet('');
            } catch (err) {
                const errorMessage = err.response?.data?.message || "Ocorreu um erro ao enviar a solicitação.";
                setError(errorMessage);
                MySwal.fire('Erro!', errorMessage, 'error');
            }
        }
    };

    return (
        <div className="swap-form-container" style={{ padding: '2rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
            <h2>Solicitar Troca de GOLD por GCASH</h2>
            <p style={{ marginBottom: '0.5rem' }}>
                Cotação atual: <strong>{rates.GOLD_TO_GCASH_RATE?.toLocaleString('pt-BR')} GOLD</strong> = <strong>1 GCASH</strong>
            </p>
            <p style={{ marginTop: 0, marginBottom: '1rem', fontSize: '0.9em' }}>
                Seu saldo: {userData?.Money.toLocaleString('pt-BR')} GOLD
            </p>

            <div className="message error" style={{border: '1px solid #e74c3c', padding: '1rem', marginBottom: '1rem'}}>
                <strong>ATENÇÃO:</strong> A carteira informada deve ser da rede SOLANA. Certifique-se de que o endereço está 100% correto. Em caso de erro, o GOLD será debitado e os tokens GCASH serão perdidos permanentemente, sem possibilidade de reembolso.
            </div>

            <form onSubmit={handleSubmit} className="hightech-form">
                <div className="form-group">
                    <label>Quantidade de GOLD para trocar:</label>
                    <input type="number" value={goldAmount} onChange={e => setGoldAmount(e.target.value)} required />
                </div>
                <p>Você receberá aproximadamente: <strong style={{color: '#9945FF'}}>{calculatedGcash().toLocaleString('pt-BR')} GCASH</strong></p>

                <div className="form-group" style={{marginTop: '1.5rem'}}>
                    <label>Sua Carteira Solana (Endereço de Recebimento):</label>
                    <input type="text" value={solanaWallet} onChange={e => setSolanaWallet(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Confirme sua Carteira Solana:</label>
                    <input type="text" value={confirmWallet} onChange={e => setConfirmWallet(e.target.value)} required />
                </div>

                {error && <p className="message error" style={{display: 'none'}}>{error}</p>}
                {successMessage && <p className="message success" style={{display: 'none'}}>{successMessage}</p>}

                <button type="submit" className="buy-button-logged-in" style={{marginTop: '1rem'}}>
                    Enviar Solicitação de Troca
                </button>
            </form>
        </div>
    );
};

// =================================================================================
// Componente para o formulário de SWAP de GCASH para BRL
// =================================================================================
const GcashToBrlSwap = ({ rates, token, walletBalance, isFetchingBalance, onTransactionSuccess }) => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const [gcashAmount, setGcashAmount] = useState('');
    const [pixKey, setPixKey] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const calculatedBrl = () => {
        if (!rates.GCASH_TO_BRL_RATE || !gcashAmount) return '0.00';
        return (parseFloat(gcashAmount) * rates.GCASH_TO_BRL_RATE).toFixed(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        
        const amount = parseFloat(gcashAmount);

        if (!publicKey) {
            MySwal.fire('Erro', 'Por favor, conecte sua carteira Solana primeiro.', 'error');
            return;
        }
        if (!amount || amount <= 0) {
            MySwal.fire('Erro', 'A quantidade de GCASH deve ser um número positivo.', 'error');
            return;
        }
        if (amount > walletBalance) {
            MySwal.fire('Erro', 'Você não tem GCASH suficiente em sua carteira para esta troca.', 'error');
            return;
        }
        if (!pixKey) {
            MySwal.fire('Erro', 'A chave PIX é obrigatória.', 'error');
            return;
        }

        const result = await MySwal.fire({
            title: 'Confirmar Troca',
            html: `
                <p>Você tem certeza que deseja trocar <strong>${amount.toLocaleString('pt-BR')} GCASH</strong> por <strong>R$ ${calculatedBrl()}</strong>?</p>
                <p>O GCASH será transferido da sua carteira Solana.</p>
                <hr />
                <p>Chave PIX de Destino:<br /><strong>${pixKey}</strong></p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, confirmar troca!',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) {
            return;
        }

        setIsProcessing(true);
        try {
            setStatusMessage('Preparando a transação...');
            const gcashMint = new PublicKey(GCASH_MINT_ADDRESS);
            const treasureWallet = new PublicKey(TREASURE_WALLET_ADDRESS);

            const fromAta = await getAssociatedTokenAddress(gcashMint, publicKey);
            const toAta = await getAssociatedTokenAddress(gcashMint, treasureWallet);

            const transaction = new Transaction().add(
                createTransferInstruction(fromAta, toAta, publicKey, amount * (10 ** GCASH_DECIMALS))
            );

            setStatusMessage('Aguardando aprovação da carteira...');
            const signature = await sendTransaction(transaction, connection);
            setStatusMessage(`Transação enviada! Aguardando confirmação... (TX: ${signature.substring(0, 20)}...)`);

            await connection.confirmTransaction(signature, 'confirmed');

            setStatusMessage('Transação confirmada! Verificando com o servidor...');

            const response = await api.post(
                '/swap/verify-gcash-swap',
                { txid: signature, pixKey },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccessMessage(response.data.message);
            MySwal.fire('Sucesso!', response.data.message, 'success');
            setGcashAmount('');
            setPixKey('');
            onTransactionSuccess();

        } catch (err) {
            console.error("Erro no processo de SWAP:", err);
            const message = err.response?.data?.message || err.message || "Ocorreu um erro ao enviar a solicitação.";
            setError(message);
            MySwal.fire('Erro!', message, 'error');
        } finally {
            setIsProcessing(false);
            setStatusMessage('');
        }
    };

    return (
        <div className="swap-form-container" style={{ padding: '2rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
            <h2>Solicitar Troca de GCASH por BRL (R$)</h2>
            <p style={{ marginBottom: '0.5rem' }}>
                Cotação atual: <strong>1 GCASH</strong> = <strong>R$ {rates.GCASH_TO_BRL_RATE?.toString().replace('.', ',')}</strong>
            </p>
            <p style={{ marginTop: 0, marginBottom: '1rem', fontSize: '0.9em' }}>
                Seu saldo: {isFetchingBalance ? 'Carregando...' : `${walletBalance.toLocaleString('pt-BR')} GCASH`}
            </p>

            <form onSubmit={handleSubmit} className="hightech-form">
                <div className="form-group">
                    <label>Quantidade de GCASH para trocar:</label>
                    <input type="number" value={gcashAmount} onChange={e => setGcashAmount(e.target.value)} required disabled={isProcessing} />
                </div>
                <p>Você receberá aproximadamente: <strong style={{color: '#2ecc71'}}>R$ {calculatedBrl()}</strong></p>

                <div className="form-group" style={{marginTop: '1.5rem'}}>
                    <label>Sua Chave PIX (CPF, E-mail, Telefone, etc.):</label>
                    <input type="text" value={pixKey} onChange={e => setPixKey(e.target.value)} required disabled={isProcessing} />
                </div>

                {isProcessing && <p className="message info">{statusMessage}</p>}

                <button type="submit" className="buy-button-logged-in" style={{marginTop: '1rem'}} disabled={isProcessing || !publicKey}>
                    {isProcessing ? 'Processando...' : (publicKey ? 'Iniciar Troca' : 'Conecte a Carteira')}
                </button>
            </form>
        </div>
    );
};


// =================================================================================
// Componente Principal da Página de SWAP
// =================================================================================
function SwapPage() {
    const { user, userData, token } = useAuth();
    const { connection } = useConnection();
    const { publicKey } = useWallet();

    const [rates, setRates] = useState({ GOLD_TO_GCASH_RATE: 0, GCASH_TO_BRL_RATE: 0 });
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPageEnabled, setIsPageEnabled] = useState(true);
    const [swapType, setSwapType] = useState('gold-to-gcash');
    
    const [walletBalance, setWalletBalance] = useState(0);
    const [isFetchingBalance, setIsFetchingBalance] = useState(false);

    const fetchWalletBalance = async () => {
        if (!publicKey) {
            setWalletBalance(0);
            return;
        }
        setIsFetchingBalance(true);
        try {
            const gcashMint = new PublicKey(GCASH_MINT_ADDRESS);
            const userAta = await getAssociatedTokenAddress(gcashMint, publicKey);
            const balanceInfo = await connection.getTokenAccountBalance(userAta);
            setWalletBalance(balanceInfo.value.uiAmount || 0);
        } catch (err) {
            setWalletBalance(0);
            console.log("Não foi possível buscar o saldo de GCASH, a conta pode não existir.");
        } finally {
            setIsFetchingBalance(false);
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [ratesResponse, homepageResponse] = await Promise.all([
                    api.get('/rates'),
                    api.get('/homepage')
                ]);

                setRates(ratesResponse.data);
                setRanking(homepageResponse.data.ranking);
                
                // A configuração agora vem do endpoint /homepage
                if (homepageResponse.data.settings && homepageResponse.data.settings.isSwapEnabled) {
                    setIsPageEnabled(homepageResponse.data.settings.isSwapEnabled === 'true');
                }

            } catch (err) {
                console.error("Erro ao buscar dados iniciais:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (user && publicKey) {
            fetchWalletBalance();
        }
    }, [user, publicKey, connection]);

    if (!isPageEnabled) {
        return <div className="container"><p className="message error">Esta página está desativada.</p></div>;
    }

    if (!user) {
        return (
            <div className="hightech-theme">
                <div className="site-wrapper">
                    <div className="container" style={{textAlign: 'center'}}>
                        <h1>Página de SWAP</h1>
                        <p>Você precisa estar logado para trocar moedas.</p>
                    </div>
                </div>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h1>SWAP de Moedas</h1>
                            <WalletMultiButton />
                        </div>
                        <p style={{marginBottom: '2rem'}}>Bem-vindo, {user.nickname}! Use esta página para realizar trocas.</p>

                        <div className="swap-type-selector" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                            <button 
                                onClick={() => setSwapType('gold-to-gcash')} 
                                className={swapType === 'gold-to-gcash' ? 'active' : ''}
                                style={{
                                    padding: '10px 20px', 
                                    cursor: 'pointer', 
                                    border: 'none',
                                    borderRadius: '5px',
                                    backgroundColor: swapType === 'gold-to-gcash' ? '#9945FF' : '#333',
                                    color: 'white'
                                }}
                            >
                                GOLD ➔ GCASH
                            </button>
                            <button 
                                onClick={() => setSwapType('gcash-to-brl')} 
                                className={swapType === 'gcash-to-brl' ? 'active' : ''}
                                style={{
                                    padding: '10px 20px', 
                                    cursor: 'pointer', 
                                    border: 'none',
                                    borderRadius: '5px',
                                    backgroundColor: swapType === 'gcash-to-brl' ? '#2ecc71' : '#333',
                                    color: 'white'
                                }}
                            >
                                GCASH ➔ BRL (R$)
                            </button>
                        </div>

                        {loading ? (
                            <p>Carregando...</p>
                        ) : (
                            <> 
                                {swapType === 'gold-to-gcash' && <GoldToGcashSwap rates={rates} userData={userData} token={token} />}
                                {swapType === 'gcash-to-brl' && 
                                    <GcashToBrlSwap 
                                        rates={rates} 
                                        token={token} 
                                        walletBalance={walletBalance} 
                                        isFetchingBalance={isFetchingBalance}
                                        onTransactionSuccess={fetchWalletBalance} // Passa a função para re-buscar o saldo
                                    />}
                            </>
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

export default SwapPage;