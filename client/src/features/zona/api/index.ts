import { serverAPI } from '@/lib/api';

// --- Types ---
export interface Zona {
  id_zona: string;
  id_ruangan: string;
  nama_zona: string;
  deskripsi?: string;
  waktu_dibuat?: string;
  waktu_diperbarui?: string;
}

// --- Zona Endpoints ---
export const getZona = async (params?: any): Promise<Zona[]> => {
  const response = await serverAPI.get('/zona', { params });
  return response.data.data || response.data;
};

export const getZonaById = async (id: string): Promise<Zona> => {
  const response = await serverAPI.get(`/zona/${id}`);
  return response.data.data || response.data;
};

export const createZona = async (data: any): Promise<Zona> => {
  const response = await serverAPI.post('/zona', data);
  return response.data.data || response.data;
};

export const updateZona = async (id: string, data: any): Promise<Zona> => {
  const response = await serverAPI.put(`/zona/${id}`, data);
  return response.data.data || response.data;
};

export const deleteZona = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/zona/${id}`);
  return response.data;
};
