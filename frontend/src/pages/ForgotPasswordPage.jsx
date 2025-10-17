// src/pages/ForgotPasswordPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios'; // Supondo que a configuração do axios esteja aqui
import styles from '../public.module.css'; // Reutilizando estilos

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      await apiClient.post('/auth/forgot-password', { email });
      setMessage('Se uma conta com este e-mail existir em nosso sistema, um link para redefinição de senha foi enviado. Por favor, verifique sua caixa de entrada e spam.');
    } catch (err) {
      // Por segurança, não informamos se o erro foi "usuário não encontrado"
      setError('Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h2 className={styles.authTitle}>Esqueceu sua Senha?</h2>
        <p style={{ textAlign: 'center', marginBottom: '20px' }}>
          Insira seu e-mail abaixo e enviaremos um link para você redefinir sua senha.
        </p>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          {message && <p className={styles.successMessage}>{message}</p>}
          {error && <p className={styles.errorMessage}>{error}</p>}

          <button type="submit" className={styles.authButton} disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar Link de Redefinição'}
          </button>
        </form>
        <div className={styles.authLink}>
          <p>Lembrou a senha? <Link to="/login">Faça Login</Link></p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
