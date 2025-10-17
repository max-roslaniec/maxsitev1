// frontend/src/pages/RegisterPage.jsx
import { useState } from 'react';
import api from '../api/axios';

function RegisterPage() {
  const [formData, setFormData] = useState({
    id: '',
    gamePassword: '', // Nova senha para o jogo
    confirmGamePassword: '', // Confirmação da senha do jogo
    sitePassword: '', // Nova senha para o site
    confirmSitePassword: '', // Confirmação da senha do site
    nickname: '',
    email: '',
    gender: '', 
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' ou 'error'

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Função de validação da complexidade da senha do site
  const validateSitePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('A senha do site deve ter no mínimo 8 caracteres.');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('A senha do site deve conter pelo menos uma letra maiúscula.');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('A senha do site deve conter pelo menos uma letra minúscula.');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('A senha do site deve conter pelo menos um número.');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};inaly:"\\|,.<>/?]/.test(password)) {
      errors.push('A senha do site deve conter pelo menos um caractere especial.');
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    // --- VALIDAÇÃO NO FRONTEND ---
    if (!/^[a-zA-Z0-9]+$/.test(formData.id)) {
      setMessage('O ID de Login deve conter apenas letras e números.');
      setMessageType('error');
      return;
    }

    // Validação do Nickname (não pode ter espaços ou caracteres especiais)
    if (!/^[a-zA-Z0-9]+$/.test(formData.nickname)) {
      setMessage('O Nickname deve conter apenas letras e números, sem espaços ou caracteres especiais.');
      setMessageType('error');
      return;
    }

    const sitePasswordErrors = validateSitePassword(formData.sitePassword);
    if (sitePasswordErrors.length > 0) {
      setMessage(sitePasswordErrors.join(' '));
      setMessageType('error');
      return;
    }

    if (formData.sitePassword !== formData.confirmSitePassword) {
      setMessage('A senha do site e a confirmação não coincidem.');
      setMessageType('error');
      return;
    }

    if (formData.gamePassword !== formData.confirmGamePassword) {
      setMessage('A senha do jogo e a confirmação não coincidem.');
      setMessageType('error');
      return;
    }

    if (formData.gamePassword === formData.sitePassword) {
      setMessage('A senha do jogo e a senha do site devem ser diferentes.');
      setMessageType('error');
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        id: formData.id,
        gamePassword: formData.gamePassword,
        sitePassword: formData.sitePassword,
        nickname: formData.nickname,
        email: formData.email,
        gender: formData.gender,
      });
      setMessage(response.data.message);
      setMessageType('success');
      // Limpa o formulário após o sucesso
      setFormData({ id: '', gamePassword: '', confirmGamePassword: '', sitePassword: '', confirmSitePassword: '', nickname: '', email: '', gender: '' });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ocorreu um erro inesperado.';
      setMessage(errorMessage);
      setMessageType('error');
    }
  };

  return (
    <div className="hightech-theme">
      <div className="site-wrapper">
        <div className="container">
          <h1>Criar Nova Conta</h1>

          {message && (
            <div className={`message ${messageType === 'success' ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="hightech-form">
            <div className="form-group">
              <label htmlFor="id">ID de Login (máx. 16 caracteres, sem especiais)</label>
              <input type="text" id="id" name="id" value={formData.id} onChange={handleChange} required maxLength="16" />
            </div>

            <div className="form-group">
              <label htmlFor="nickname">Nickname (máx. 16 caracteres)</label>
              <input type="text" id="nickname" name="nickname" value={formData.nickname} onChange={handleChange} required maxLength="16" />
            </div>

            <div className="form-group">
              <label htmlFor="gamePassword">Senha do Jogo (máx. 20 caracteres)</label>
              <input type="password" id="gamePassword" name="gamePassword" value={formData.gamePassword} onChange={handleChange} required maxLength="20" />
            </div>

            <div className="form-group">
              <label htmlFor="confirmGamePassword">Confirmar Senha do Jogo</label>
              <input type="password" id="confirmGamePassword" name="confirmGamePassword" value={formData.confirmGamePassword} onChange={handleChange} required maxLength="20" />
            </div>

            <div className="form-group">
              <label htmlFor="sitePassword">Senha do Site (mín. 8 caracteres, complexa)</label>
              <input type="password" id="sitePassword" name="sitePassword" value={formData.sitePassword} onChange={handleChange} required minLength="8" placeholder="Ex: Senha123!" />
            </div>

            <div className="form-group">
              <label htmlFor="confirmSitePassword">Confirmar Senha do Site</label>
              <input type="password" id="confirmSitePassword" name="confirmSitePassword" value={formData.confirmSitePassword} onChange={handleChange} required minLength="8" />
            </div>

            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gênero</label>
              <select id="gender" name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="">Selecione o Gênero</option>
                <option value="0">Masculino</option>
                <option value="1">Feminino</option>
              </select>
            </div>

            <button type="submit" className="register-button">Finalizar Cadastro</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;