import { serverAPI } from '@/lib/api';

// --- Types ---
export interface Pengguna {
  id_pengguna: string;
  nama: string;
  email: string;
  peran: string;
  waktu_dibuat?: string;
  waktu_diperbarui?: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: Pengguna;
}

// --- Auth Endpoints ---
export const login = async (data: any): Promise<AuthResponse> => {
  const response = await serverAPI.post('/auth/login', data);
  return response.data;
};

export const register = async (data: any): Promise<AuthResponse> => {
  const response = await serverAPI.post('/auth/register', data);
  return response.data;
};

export const forgotPassword = async (data: { email: string }): Promise<any> => {
  const response = await serverAPI.post('/auth/forgot-password', data);
  return response.data;
};

export const resetPassword = async (data: any): Promise<any> => {
  const response = await serverAPI.post('/auth/reset-password', data);
  return response.data;
};

export const me = async (): Promise<{ user: Pengguna }> => {
  const response = await serverAPI.get('/auth/me');
  return response.data;
};

// --- Pengguna CRUD Endpoints ---
export const getPengguna = async (): Promise<Pengguna[]> => {
  const response = await serverAPI.get('/pengguna');
  return response.data.data || response.data;
};

export const getPenggunaById = async (id: string): Promise<Pengguna> => {
  const response = await serverAPI.get(`/pengguna/${id}`);
  return response.data.data || response.data;
};

export const createPengguna = async (data: any): Promise<Pengguna> => {
  const response = await serverAPI.post('/pengguna', data);
  return response.data.data || response.data;
};

export const updatePengguna = async (id: string, data: any): Promise<Pengguna> => {
  const response = await serverAPI.put(`/pengguna/${id}`, data);
  return response.data.data || response.data;
};

export const deletePengguna = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/pengguna/${id}`);
  return response.data;
};
