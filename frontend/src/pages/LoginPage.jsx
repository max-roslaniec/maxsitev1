// frontend/src/pages/LoginPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Importar o Link
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

function LoginPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { user, login } = useAuth(); // Pegamos o 'user' para saber se já está logado
  const navigate = useNavigate();
  const location = useLocation();

  // Se o usuário já estiver logado e tentar acessar a página de login,
  // redireciona ele para a homepage.
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Tenta fazer o login usando a função do nosso AuthContext
    const result = await login(id, password);

    if (result.success) {
      // Após o login bem-sucedido, redireciona o usuário para a página inicial
      navigate('/');
    } else {
      // Se o login falhar, exibe a mensagem de erro da API
      setError(result.message);
    }
  };

  return (
    <div className="hightech-theme">
      <div className="site-wrapper">
        <div className="container">
          <h1>Login de Acesso</h1>

          {error && (
            <div className="message error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="hightech-form">
            <div className="form-group">
              <label htmlFor="id">ID de Login</label>
              <input 
                type="text" 
                id="id" 
                value={id} 
                onChange={(e) => setId(e.target.value)} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <input 
                type="password" 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            <div style={{ textAlign: 'right', margin: '-10px 0 15px 0', fontSize: '0.9em' }}>
              <Link to="/forgot-password">Esqueceu sua senha?</Link>
            </div>

            <button type="submit" className="register-button">Entrar</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;