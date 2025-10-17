// frontend/src/contexts/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(() => sessionStorage.getItem('refreshToken'));
  const [userData, setUserData] = useState(null);

  // Versão corrigida: não precisa de 'token' como argumento.
  // O interceptor do Axios cuidará de adicionar o header de autorização.
  const fetchUserData = async () => {
    try {
      // A chamada agora é mais limpa, sem headers manuais.
      const response = await api.get('/user/me');
      setUserData(response.data);
    } catch (error) {
      console.error("Não foi possível buscar os dados do usuário. O interceptor cuidará da renovação, se necessário.", error);
    }
  };
  
  useEffect(() => {
    // Se temos um token, buscamos os dados do usuário.
    if (accessToken) {
      fetchUserData();
    }
  }, [accessToken]);

  useEffect(() => {
    const handleSessionRefresh = () => {
      console.log("Sessão renovada! Atualizando o AuthContext.");
      const newAccessToken = sessionStorage.getItem('accessToken');
      const savedUser = sessionStorage.getItem('user');
      
      setAccessToken(newAccessToken);
      setUser(savedUser ? JSON.parse(savedUser) : null);
      
      // A busca de dados do usuário já é acionada pelo useEffect acima,
      // quando o 'accessToken' é atualizado.
    };
    window.addEventListener('sessionRefreshed', handleSessionRefresh);
    return () => {
      window.removeEventListener('sessionRefreshed', handleSessionRefresh);
    };
  }, []);

  const login = async (id, password) => {
    try {
      const response = await api.post('/auth/login', { id, password });
      setUser(response.data.user);
      setAccessToken(response.data.accessToken);
      setRefreshToken(response.data.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
      sessionStorage.setItem('accessToken', response.data.accessToken);
      sessionStorage.setItem('refreshToken', response.data.refreshToken);
      
      // Após o login, o useEffect será acionado para buscar os dados.
      // Uma chamada manual aqui também é possível e segura na versão corrigida.
      await fetchUserData(); 

      return { success: true, user: response.data.user };
    } catch (error) {
      console.error("Falha no login:", error);
      return { success: false, message: error.response?.data?.message || 'Erro de rede' };
    }
  };

  const logout = async () => {
    try {
      const currentRefreshToken = sessionStorage.getItem('refreshToken');
      if (currentRefreshToken) {
        await api.post('/auth/logout', { refreshToken: currentRefreshToken });
      }
    } catch (error) {
      console.error("Erro no logout do servidor, limpando localmente de qualquer forma.", error);
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setUserData(null);
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, refreshToken, userData, login, logout, fetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
