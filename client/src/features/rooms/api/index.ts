import { serverAPI } from '@/lib/api';
import { Room, ApiResponse } from '../types';

export const roomsApi = {
  getAll: async (): Promise<ApiResponse<Room[]>> => {
    const response = await serverAPI.get('/rooms');
    return response.data;
  },
  
  getById: async (id: string): Promise<ApiResponse<Room>> => {
    const response = await serverAPI.get(`/rooms/${id}`);
    return response.data;
  },

  create: async (payload: Omit<Room, 'room_id'>): Promise<ApiResponse<Room>> => {
    const response = await serverAPI.post('/rooms', payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<Room>): Promise<ApiResponse<Room>> => {
    const response = await serverAPI.put(`/rooms/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<ApiResponse<void>> => {
    const response = await serverAPI.delete(`/rooms/${id}`);
    return response.data;
  }
};
