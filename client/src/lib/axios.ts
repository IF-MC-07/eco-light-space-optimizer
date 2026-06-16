import axios from 'axios';
import { handleTokenRefresh } from './refreshToken';
import { removeAuthCookie } from '../features/auth/actions';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Crucial for sending cookies to the backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Removed localStorage token check.
// Authentication is now handled via HTTP-only cookies sent automatically.
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle unauthorized response and refresh flow
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (error.response.data?.error === 'TOKEN_EXPIRED') {
        return handleTokenRefresh(api, error);
      } else {
        await removeAuthCookie();
        if (typeof window !== 'undefined') {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
