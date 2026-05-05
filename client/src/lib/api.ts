import axios from 'axios';

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
  baseURL: process.env.NEXT_PUBLIC_PYTHON_SERVICE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentication is handled via HTTP-only cookies (withCredentials: true)

export { serverAPI, pythonAPI };