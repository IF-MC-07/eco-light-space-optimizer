import { serverAPI } from '@/lib/api';
import { User, ApiResponse } from '../types';

export const usersApi = {
  getAll: async (filters?: any): Promise<ApiResponse<User[]>> => {
    const response = await serverAPI.get('/users', { params: filters });
    return response.data;
  },
  
  getById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await serverAPI.get(`/users/${id}`);
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<UserStats>> => {
    const response = await serverAPI.get('/users/stats');
    return response.data;
  },

  create: async (payload: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await serverAPI.post('/users', payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await serverAPI.put(`/users/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<ApiResponse<void>> => {
    const response = await serverAPI.delete(`/users/${id}`);
    return response.data;
  }
};

export const { getAll, getById, getStats, create, update, remove } = usersApi;
