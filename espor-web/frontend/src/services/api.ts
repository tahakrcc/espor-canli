import axios from 'axios';

// In production, frontend and backend are on the same domain, so use relative path
// Always use /api as baseURL since backend routes are mounted at /api/*
const baseURL = '/api';

// Debug: Log the baseURL in development
if (import.meta.env.DEV) {
  console.log('API BaseURL:', baseURL, 'VITE_API_URL:', import.meta.env.VITE_API_URL);
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - token ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - hata yönetimi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error details for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

