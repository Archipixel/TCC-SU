import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Interceptor para injetar token de autenticação se necessário futuramente
api.interceptors.request.use(
  (config) => {
    // Exemplo: const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento global de respostas e erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratar erros globais (401, 403, 500)
    if (error.response?.status === 401) {
      // Redirecionar para login ou limpar estado
    }
    return Promise.reject(error);
  }
);
