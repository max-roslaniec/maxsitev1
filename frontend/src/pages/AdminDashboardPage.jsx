// frontend/src/pages/AdminDashboardPage.jsx
import { Link } from 'react-router-dom';
import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import styles from '../admin.module.css';

function AdminDashboardPage() {
    const { token, user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdateRanking = async (e) => {
        e.preventDefault();
        if (window.confirm('Isso irá recalcular TODAS as posições e ranks do servidor. Deseja continuar?')) {
            setIsLoading(true);
            try {
                const response = await api.post('/ranking/update', {}, { 
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert(response.data.message || 'Ranking atualizado com sucesso!');
            } catch (error) {
                alert(error.response?.data?.message || 'Ocorreu um erro ao atualizar o ranking.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div>
            <h1>Painel de Administração</h1>

            <h2 style={{ textAlign: 'center', margin: '2rem 0', fontWeight: 'normal' }}>
                Bem-vindo, <strong>{user?.nickname || 'Admin'}</strong>!
            </h2>

            <div className={styles.dashboardContainer}>
                <Link to="/admin/shop" className={styles.dashboardCard}>
                    <h2>Gerenciar Loja</h2>
                    <p>Adicionar, editar e remover itens da loja de avatares.</p>
                </Link>
                <Link to="/admin/users" className={styles.dashboardCard}>
                    <h2>Gerenciar Usuários</h2>
                    <p>Listar, buscar, editar e excluir contas de jogadores.</p>
                </Link>
                <Link to="/admin/news" className={styles.dashboardCard}>
                    <h2>Gerenciar Notícias</h2>
                    <p>Criar, editar ou remover notícias da página principal.</p>
                </Link>
                <Link to="/admin/swaps" className={styles.dashboardCard}>
                    <h2>Gerenciar Swaps</h2>
                    <p>Visualizar e aprovar solicitações de troca de GOLD por GCASH.</p>
                </Link>
                <Link to="/admin/guilds/requests" className={styles.dashboardCard}>
                    <h2>Pedidos de Guild</h2>
                    <p>Aprovar ou reprovar pedidos de criação de novas guildas.</p>
                </Link>
                <Link to="/admin/settings" className={styles.dashboardCard}>
                    <h2>Configurações</h2>
                    <p>Ajustar as cotações de moedas e outras configurações do site.</p>
                </Link>
            </div>
            
            <div className={styles.footerActions}>
                <form onSubmit={handleUpdateRanking}>
                    <button type="submit" className={styles.buttonUpdate} disabled={isLoading}>
                        {isLoading ? 'Atualizando...' : 'Atualizar Todos os Rankings'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AdminDashboardPage;