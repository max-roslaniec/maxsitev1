// frontend/src/pages/ShopPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import UserPanel from '../components/UserPanel';
import LoginForm from '../components/LoginForm';

import GachaModal from '../components/GachaModal';

const MySwal = withReactContent(Swal);

const TREASURE_WALLET_ADDRESS = "D1fgz9vCA66EK65ZBY62g7whU5aZ4yQ82aTZL8nfkNfW";
const GCASH_TOKEN_ADDRESS = "GgrKV3TcrPoDkCrzx9gMFRJgTC1nxNEDtx7NnVJAKPPE";
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

function ShopPage() {
  const [items, setItems] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({ searchName: '', gender: '', type: '' });
  const [activeFilters, setActiveFilters] = useState({ searchName: '', gender: '', type: '' });
  const { user, userData, fetchUserData } = useAuth();
  
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [processingPayment, setProcessingPayment] = useState(null);

  // --- Estados para o Gacha ---
  const [gachaReward, setGachaReward] = useState(null);
  const [isGachaModalOpen, setIsGachaModalOpen] = useState(false);
  // ---------------------------

  const userInventory = useMemo(() => new Set(userData?.inventory || []), [userData]);

  useEffect(() => {
    const fetchPageData = async () => {
        setLoading(true);
        setError('');
        try {
          // Fetch shop items
          const params = new URLSearchParams({ page: currentPage, ...activeFilters });
          for (const [key, value] of params.entries()) { if (!value) { params.delete(key); } }
          const itemsResponse = await api.get(`/shop?${params.toString()}`);
          setItems(itemsResponse.data.items);
          setTotalPages(itemsResponse.data.totalPages);

          // Fetch ranking data
          const rankingResponse = await api.get('/homepage');
          setRanking(rankingResponse.data.ranking);

        } catch (err) {
          console.error("Erro ao buscar dados da página:", err);
          if (err.response && err.response.status === 403) {
            setError(err.response.data.message || 'Esta página está desativada.');
          } else {
            setError('Não foi possível carregar os dados da página.');
          }
        } finally {
          setLoading(false);
        }
    };

    fetchPageData();
  }, [currentPage, activeFilters]);

  const handleGcashPurchase = async (item) => {
    if (!publicKey) {
      MySwal.fire('Carteira não conectada', 'Por favor, conecte sua carteira Solana primeiro.', 'warning');
      return;
    }
    if (!user) {
      MySwal.fire('Usuário não logado', 'Você precisa estar logado no site para fazer uma compra.', 'warning');
      return;
    }
    if (!item.price_gcash) {
        MySwal.fire('Erro no Item', 'Este item não parece estar à venda por GCASH.', 'error');
        return;
    }

    const result = await MySwal.fire({
        title: 'Confirmar Compra',
        html: `
            <p>Você tem certeza que deseja comprar <strong>${item.name}</strong> por <strong>${item.price_gcash.toLocaleString('pt-BR')} GCASH</strong>?</p>
            <p>O valor será transferido da sua carteira Solana conectada.</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#9945FF',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, comprar!',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
        return;
    }

    setProcessingPayment(item.itemId);
    try {
      MySwal.fire({ title: 'Processando...', html: 'Preparando a transação...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });
      
      const mintPublicKey = new PublicKey(GCASH_TOKEN_ADDRESS);
      const destinationPublicKey = new PublicKey(TREASURE_WALLET_ADDRESS);
      const amount = item.price_gcash * (10 ** GCASH_DECIMALS);
      
      const fromAta = await getAssociatedTokenAddress(mintPublicKey, publicKey);
      const toAta = await getAssociatedTokenAddress(mintPublicKey, destinationPublicKey);
      
      const transaction = new Transaction().add(
        createTransferInstruction(fromAta, toAta, publicKey, amount)
      );

      MySwal.update({ html: 'Aguardando aprovação da carteira...' });
      const txid = await sendTransaction(transaction, connection);
      console.log(`Transação enviada com TXID: ${txid}`);

      MySwal.update({ html: `Transação enviada! Aguardando confirmação...<br/><small>${txid}</small>` });
      await connection.confirmTransaction(txid, 'confirmed');

      MySwal.update({ html: 'Confirmado! Verificando com o servidor...' });
      const response = await api.post('/gcash/verify-purchase',
        { txid: txid, itemId: item.itemId }
      );

      MySwal.fire('Sucesso!', `Backend confirmou! ${response.data.message}`, 'success');
      await fetchUserData(); // Re-fetch user data to update inventory

    } catch (error) {
      console.error('Erro durante a compra com GCASH:', error);
      const apiErrorMessage = error.response?.data?.message || error.message || 'Verifique o console para mais detalhes.';
      MySwal.fire('Erro!', `Ocorreu um erro: ${apiErrorMessage}`, 'error');
    } finally {
      setProcessingPayment(null);
    }
  };

  const handlePurchase = async (item) => {
    const result = await MySwal.fire({
        title: 'Confirmar Compra',
        text: `Você confirma a compra de "${item.name}" por ${item.price_cash.toLocaleString('pt-BR')} CASH?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, comprar!',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const response = await api.post('/shop/buy',
                { itemId: item.itemId }
            );
            MySwal.fire('Sucesso!', response.data.message, 'success');
            await fetchUserData(); // Re-fetch user data to update inventory
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Ocorreu um erro ao processar a compra.';
            MySwal.fire('Erro!', errorMessage, 'error');
        }
    }
  };

  const handleGachaPurchase = async (item) => {
    const result = await MySwal.fire({
        title: 'Confirmar Compra de Gacha',
        text: `Você confirma a compra de "${item.name}" por ${item.price_cash.toLocaleString('pt-BR')} CASH?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, comprar!',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            MySwal.fire({ title: 'Processando...', html: 'Abrindo a caixa...!', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });
            const response = await api.post('/shop/buy-gacha',
                { itemId: item.itemId }
            );
            setGachaReward(response.data.reward);
            setIsGachaModalOpen(true);
            MySwal.close();
            await fetchUserData(); // Re-fetch user data to update inventory and balance
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Ocorreu um erro ao processar a compra.';
            MySwal.fire('Erro!', errorMessage, 'error');
        }
    }
  };

  const closeGachaModal = () => {
    setIsGachaModalOpen(false);
    setGachaReward(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setActiveFilters(filters);
  };
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pageButtons = [];
    for (let i = 1; i <= totalPages; i++) {
      pageButtons.push(
        <button key={i} onClick={() => setCurrentPage(i)} className={currentPage === i ? 'active' : ''}>
          {i}
        </button>
      );
    }
    return (
      <div className="pagination">
        {currentPage > 1 && <button onClick={() => setCurrentPage(p => p - 1)} className="prev-next">&laquo; Anterior</button>}
        <div className="page-numbers">{pageButtons}</div>
        {currentPage < totalPages && <button onClick={() => setCurrentPage(p => p + 1)} className="prev-next">Próxima &raquo;</button>}
      </div>
    );
  };

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
                    <h1>AVATAR SHOP</h1>
                    <WalletMultiButton />
                </div>
                
                <div className="filter-container">
                    <form onSubmit={handleFilterSubmit}>
                    <input type="text" name="searchName" placeholder="Buscar por nome..." value={filters.searchName} onChange={handleFilterChange} className="filter-search" />
                    <select name="gender" value={filters.gender} onChange={handleFilterChange}>
                        <option value="">Todos os Gêneros</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="UNISSEX">UNISSEX</option>
                    </select>
                    <select name="type" value={filters.type} onChange={handleFilterChange}>
                        <option value="">Todas as Partes</option>
                        <option value="CABEÇA">CABEÇA</option>
                        <option value="CORPO">CORPO</option>
                        <option value="ÓCULOS">ÓCULOS</option>
                        <option value="BANDEIRA">BANDEIRA</option>
                        <option value="POWER USER">POWER USER</option>
                        <option value="GACHA">GACHA</option>
                    </select>
                    <button type="submit">Filtrar</button>
                    </form>
                </div>

                {loading ? ( <p>Carregando...</p> ) : error ? ( <p>{error}</p> ) : (
                    <>
                    <div className="shop-container">
                        {items.length > 0 ? items.map(item => {
                        const isOwned = userInventory.has(item.itemId);
                        return (
                            <div key={item.itemId} className="item-card">
                            <img src={`${import.meta.env.VITE_API_URL}${item.imageUrl}`} alt={item.name} className="item-image" />
                            <h3 className="item-name">{item.name}</h3>
                            
                            <div className="item-details">
                                <p><strong>ID:</strong> {item.itemId}</p>
                                <p><strong>Gênero:</strong> {item.gender}</p>
                                <p><strong>Tipo:</strong> {item.type}</p>
                            </div>

                            {item.price_cash && (
                                <>
                                <p className="item-price">{item.price_cash.toLocaleString('pt-BR')} CASH</p>
                                {user ? (
                                    item.type === 'GACHA' ? (
                                        <button className="buy-button-logged-in" onClick={() => handleGachaPurchase(item)}>Comprar Gacha (CASH)</button>
                                    ) : isOwned ? (
                                        <span className="owned-item-text">Você já possui</span>
                                    ) : (
                                        <button className="buy-button-logged-in" onClick={() => handlePurchase(item)}>Comprar (CASH)</button>
                                    )
                                ) : (
                                    <Link to="/login" className="login-to-buy-button">Faça login para comprar</Link>
                                )}
                                </>
                            )}

                            {item.price_gcash && (
                                <>
                                <p className="item-price" style={{color: '#9945FF', marginTop: '10px'}}>{item.price_gcash.toLocaleString('pt-BR')} GCASH</p>
                                {isOwned ? (
                                    <span className="owned-item-text">Você já possui</span>
                                ) : (
                                    <button 
                                    className="buy-button-logged-in" 
                                    style={{backgroundColor: '#9945FF'}}
                                    onClick={() => handleGcashPurchase(item)}
                                    disabled={!publicKey || processingPayment === item.itemId || !user}
                                    >
                                    {processingPayment === item.itemId ? 'Processando...' : 'Comprar (GCASH)'}
                                    </button>
                                )}
                                </>
                            )}

                            </div>
                        );
                        }) : <p>Nenhum item encontrado.</p>}
                    </div>
                    {renderPagination()}
                    </>
                )}
            </main>
            <aside className="sidebar-right">
                { user ? <UserPanel /> : <LoginForm /> }
            </aside>
        </div>
      </div>
      {isGachaModalOpen && <GachaModal reward={gachaReward} onClose={closeGachaModal} />}
    </div>
  );
}

export default ShopPage;
