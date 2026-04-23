import axios from 'axios';

const serverAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const pythonAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_PYTHON_SERVICE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto attach token jika ada
serverAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export { serverAPI, pythonAPI };