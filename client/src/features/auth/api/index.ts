import { serverAPI } from '@/lib/api';
import type { User, AuthResponse } from '@/types';

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

export const me = async (): Promise<{ user: User }> => {
  const response = await serverAPI.get('/auth/me');
  return response.data;
};

// --- User CRUD Endpoints ---
export const getUsers = async (): Promise<User[]> => {
  const response = await serverAPI.get('/users');
  return response.data.data || response.data;
};

export const getUserById = async (id: string): Promise<User> => {
  const response = await serverAPI.get(`/users/${id}`);
  return response.data.data || response.data;
};

export const createUser = async (data: any): Promise<User> => {
  const response = await serverAPI.post('/users', data);
  return response.data.data || response.data;
};

export const updateUser = async (id: string, data: any): Promise<User> => {
  const response = await serverAPI.put(`/users/${id}`, data);
  return response.data.data || response.data;
};

export const deleteUser = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/users/${id}`);
  return response.data;
};
