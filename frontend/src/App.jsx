// frontend/src/App.jsx
import { Routes, Route } from 'react-router-dom';

// Layouts
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';

// Páginas Públicas
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import RankingPage from './pages/RankingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NewsArticlePage from './pages/NewsArticlePage';
import TopUpPage from './pages/TopUpPage';
import SwapPage from './pages/SwapPage';
import CreateGuildPage from './pages/CreateGuildPage';
import GuildDirectoryPage from './pages/GuildDirectoryPage';
import GuildManagePage from './pages/GuildManagePage';
import GuildRankingPage from './pages/GuildRankingPage'; // <-- 1. IMPORTE A NOVA PÁGINA
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Páginas de Admin
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminNewsPage from './pages/AdminNewsPage';
import AdminNewsForm from './pages/AdminNewsForm';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminUserForm from './pages/AdminUserForm';
import AdminShopPage from './pages/AdminShopPage';
import AdminShopForm from './pages/AdminShopForm';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminSwapRequestsPage from './pages/AdminSwapRequestsPage';
import AdminGuildRequestsPage from './pages/AdminGuildRequestsPage';

function App() {
  return (
    <Routes>
      {/* Rotas Públicas com o Layout Principal */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="ranking/guilds" element={<GuildRankingPage />} /> {/* <-- 2. ADICIONE A NOVA ROTA AQUI */}
        <Route path="topup" element={<TopUpPage />} />
        <Route path="swap" element={<SwapPage />} />
        <Route path="guilds" element={<GuildDirectoryPage />} />
        <Route path="guilds/create" element={<CreateGuildPage />} />
        <Route path="guild/manage/:guildId" element={<GuildManagePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="news/:id" element={<NewsArticlePage />} />
        <Route path="*" element={<h1>404: Página Pública Não Encontrada</h1>} />
      </Route>

      {/* Rota de Login do Admin */}
      <Route path="/gerenciamento/login" element={<AdminLoginPage />} />
      
      {/* Rotas Protegidas do Admin com o Layout de Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="news" element={<AdminNewsPage />} />
        <Route path="news/new" element={<AdminNewsForm />} />
        <Route path="news/edit/:id" element={<AdminNewsForm />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/edit/:id" element={<AdminUserForm />} />
        <Route path="shop" element={<AdminShopPage />} />
        <Route path="shop/new" element={<AdminShopForm />} />
        <Route path="shop/edit/:id" element={<AdminShopForm />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="swaps" element={<AdminSwapRequestsPage />} />
        <Route path="guilds/requests" element={<AdminGuildRequestsPage />} />
      </Route>
    </Routes>
  );
}

export default App;