import { serverAPI } from '@/lib/api';
import { User, ApiResponse } from '../types';

export const profileApi = {
  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await serverAPI.get('/auth/me');
    return response.data;
  },
  updateProfile: async (id: number, payload: any): Promise<ApiResponse<User>> => {
    const response = await serverAPI.put(`/users/${id}`, payload);
    return response.data;
  }
};
