import { serverAPI } from '@/lib/api';
import { Room } from '@/types';

// --- Room Endpoints ---
export const getRooms = async (params?: any): Promise<Room[]> => {
  const response = await serverAPI.get('/rooms', { params });
  return response.data.data || response.data;
};

export const getRoomById = async (id: string): Promise<Room> => {
  const response = await serverAPI.get(`/rooms/${id}`);
  return response.data.data || response.data;
};

export const createRoom = async (data: any): Promise<Room> => {
  const response = await serverAPI.post('/rooms', data);
  return response.data.data || response.data;
};

export const updateRoom = async (id: string, data: any): Promise<Room> => {
  const response = await serverAPI.put(`/rooms/${id}`, data);
  return response.data.data || response.data;
};

export const deleteRoom = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/rooms/${id}`);
  return response.data;
};
