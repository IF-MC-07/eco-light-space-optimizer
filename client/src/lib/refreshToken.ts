import axios from 'axios';
import { setAuthCookie, removeAuthCookie } from '../features/auth/actions';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  const rawBaseUrl = process.env.NEXT_PUBLIC_SERVER_API_BASE_URL || 'http://localhost:5000';
  return rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;
};

// Dedicated axios instance for refreshing to prevent interceptor loops
const refreshApi = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const handleTokenRefresh = async (apiInstance: any, error: any) => {
  const originalRequest = error.config;

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(() => {
      return apiInstance(originalRequest);
    }).catch((err) => {
      return Promise.reject(err);
    });
  }

  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const response = await refreshApi.post('/auth/refresh');
    const accessToken = response.data?.accessToken;
    
    if (accessToken) {
      // Store the new access token using the existing server action
      await setAuthCookie(accessToken);
    }

    processQueue(null, accessToken);
    
    // Retry the original request
    return apiInstance(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError, null);
    
    // Refresh token expired or invalid, clear everything and redirect
    await removeAuthCookie();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
};
