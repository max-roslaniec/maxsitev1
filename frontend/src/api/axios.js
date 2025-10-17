// src/api/axios.js
import axios from 'axios';

// Cria uma instância do axios com uma configuração base
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`
});

// ====================================================================
// O INTERCEPTOR - A MÁGICA DA RENOVAÇÃO AUTOMÁTICA
// ====================================================================

// 1. Interceptor de Requisição: Adiciona o token a todas as chamadas
api.interceptors.request.use(
  (config) => {
    const accessToken = sessionStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// 2. Interceptor de Resposta: Lida com erros de token expirado
api.interceptors.response.use(
  // Se a resposta for um sucesso, apenas a retorna
  (response) => {
    return response;
  },
  // Se a resposta for um erro, executa esta lógica
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401 (Não Autorizado) e ainda não tentamos renovar o token para esta requisição
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Marca que já estamos tentando renovar

      try {
        const refreshToken = sessionStorage.getItem('refreshToken');
        if (!refreshToken) {
          // Se não houver refresh token, desloga
          sessionStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Faz a chamada para o endpoint de renovação
        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken: newAccessToken, user } = response.data;

        // Armazena os novos dados
        sessionStorage.setItem('accessToken', newAccessToken);
        sessionStorage.setItem('user', JSON.stringify(user));

        // Atualiza o header da requisição original com o novo token
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        // Dispara um evento para que o AuthContext possa atualizar seu estado
        window.dispatchEvent(new Event('sessionRefreshed'));

        // Retenta a requisição original que havia falhado
        return api(originalRequest);

      } catch (refreshError) {
        // Se a renovação falhar (ex: refresh token também expirou), desloga o usuário
        console.error("Não foi possível renovar a sessão. Deslogando...", refreshError);
        sessionStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Para qualquer outro erro, apenas o rejeita
    return Promise.reject(error);
  }
);

export default api;