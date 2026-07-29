import axios from 'axios';

const getCleanApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    const cleanUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getCleanApiBaseUrl();


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});


// Request Interceptor: Tự động đính kèm token JWT từ localStorage vào Header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý lỗi token hết hạn (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
