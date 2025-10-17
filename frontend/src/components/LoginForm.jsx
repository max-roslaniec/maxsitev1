// src/components/LoginForm.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

function LoginForm() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(id, password);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    // Usamos um Fragment <> para agrupar o formulário e o link
    <>
      <h3>LOGIN</h3>
      <form onSubmit={handleSubmit} className="hightech-form sidebar-login">
        {error && <p className="message error">{error}</p>}
        <div className="form-group">
          <label htmlFor="id">ID de Login</label>
          <input type="text" id="id" value={id} onChange={(e) => setId(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Senha</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="register-button">ENTRAR</button>
      </form>
      
      {/* O Link fica aqui, como um irmão do <form>, e não dentro dele */}
      <Link to="/register" className="sidebar-register-link">
        Ainda não tem uma conta? Cadastre-se!
      </Link>
    </>
  );
}

export default LoginForm;