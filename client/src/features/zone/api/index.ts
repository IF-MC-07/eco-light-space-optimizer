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
  const response = await serverAPI.get('/zone', { params });
  return response.data.data || response.data;
};

export const getZonaById = async (id: string): Promise<Zona> => {
  const response = await serverAPI.get(`/zone/${id}`);
  return response.data.data || response.data;
};

export const createZona = async (data: any): Promise<Zona> => {
  const response = await serverAPI.post('/zone', data);
  return response.data.data || response.data;
};

export const updateZona = async (id: string, data: any): Promise<Zona> => {
  const response = await serverAPI.put(`/zone/${id}`, data);
  return response.data.data || response.data;
};

export const deleteZona = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/zone/${id}`);
  return response.data;
};
