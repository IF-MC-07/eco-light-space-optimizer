import axios from 'axios';
import { handleTokenRefresh } from './refreshToken';
import { removeAuthCookie } from '../features/auth/actions';

const rawBaseUrl = process.env.NEXT_PUBLIC_SERVER_API_BASE_URL || 'http://localhost:5000';
const serverApiBaseUrl = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

const serverAPI = axios.create({
  baseURL: serverApiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const pythonAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_PYTHON_SERVICE_API_BASE_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentication is handled via HTTP-only cookies (withCredentials: true)

// Shared interceptor logic for handling 401 and triggering refresh flow
const interceptor = (instance: any) => async (error: any) => {
  const originalRequest = error.config;
  
  if (error.response && error.response.status === 401 && !originalRequest._retry) {
    if (error.response.data?.error === 'TOKEN_EXPIRED') {
      return handleTokenRefresh(instance, error);
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
};

serverAPI.interceptors.response.use((response) => response, interceptor(serverAPI));
pythonAPI.interceptors.response.use((response) => response, interceptor(pythonAPI));

export { serverAPI, pythonAPI };