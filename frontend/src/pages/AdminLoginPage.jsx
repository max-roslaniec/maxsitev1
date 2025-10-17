// src/pages/AdminLoginPage.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const loginContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  backgroundColor: '#1a1a1a'
};

const loginBoxStyle = {
  padding: '2rem',
  width: '350px',
  backgroundColor: '#1f1f1f',
  borderRadius: '8px',
  border: '1px solid #ff5555'
};

function AdminLoginPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, logout } = useAuth(); // Importamos a função de logout também
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const result = await login(id, password);
      
      if (result.success && result.user) {
        // Verificação explícita da autoridade retornada pela função de login
        if (result.user.authority == 100) {
          navigate(from, { replace: true });
        } else {
          // Se o login foi um sucesso, mas o usuário não é admin,
          // informamos o erro e fazemos o logout para limpar a sessão.
          setError('Acesso negado. Esta conta não é de um administrador.');
          console.error('Tentativa de login admin falhou. Autoridade recebida:', result.user.authority);
          await logout(); // Garante que a sessão não-admin seja encerrada
        }
      } else {
        // Se o result.success for false ou o usuário não for retornado
        setError(result.message || 'Falha no login. Verifique suas credenciais.');
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado durante o login.');
      console.error('Erro no handleSubmit do AdminLoginPage:', err);
    }
  };

  return (
    <div style={loginContainerStyle}>
      <div style={loginBoxStyle}>
        <h1 style={{textAlign: 'center', color: '#ff5555'}}>Acesso Restrito</h1>
        <form onSubmit={handleSubmit} className="hightech-form">
          {error && <p className="message error">{error}</p>}
          <div className="form-group">
            <label htmlFor="id">ID de Admin</label>
            <input type="text" id="id" value={id} onChange={(e) => setId(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="register-button">Entrar</button>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginPage;