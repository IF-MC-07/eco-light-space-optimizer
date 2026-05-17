import { serverAPI } from '@/lib/api';
import type { Zone } from '@/types';

// --- Zone Endpoints ---
export const getZones = async (params?: any): Promise<Zone[]> => {
  const response = await serverAPI.get('/zones', { params });
  return response.data.data || response.data;
};

export const getZoneById = async (id: string): Promise<Zone> => {
  const response = await serverAPI.get(`/zones/${id}`);
  return response.data.data || response.data;
};

export const createZone = async (data: any): Promise<Zone> => {
  const response = await serverAPI.post('/zones', data);
  return response.data.data || response.data;
};

export const updateZone = async (id: string, data: any): Promise<Zone> => {
  const response = await serverAPI.put(`/zones/${id}`, data);
  return response.data.data || response.data;
};

export const deleteZone = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/zones/${id}`);
  return response.data;
};
