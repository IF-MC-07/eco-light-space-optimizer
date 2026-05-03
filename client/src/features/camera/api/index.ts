import { serverAPI } from '@/lib/api';
import { Camera } from '@/types';

// --- Camera Endpoints ---
export const getCameras = async (params?: any): Promise<Camera[]> => {
  const response = await serverAPI.get('/cameras', { params });
  return response.data.data || response.data;
};

export const getCameraById = async (id: string): Promise<Camera> => {
  const response = await serverAPI.get(`/cameras/${id}`);
  return response.data.data || response.data;
};

export const createCamera = async (data: any): Promise<Camera> => {
  const response = await serverAPI.post('/cameras', data);
  return response.data.data || response.data;
};

export const updateCamera = async (id: string, data: any): Promise<Camera> => {
  const response = await serverAPI.put(`/cameras/${id}`, data);
  return response.data.data || response.data;
};

export const deleteCamera = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/cameras/${id}`);
  return response.data;
};
