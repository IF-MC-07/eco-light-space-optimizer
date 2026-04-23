import { serverAPI } from '@/lib/api';

// --- Types ---
export interface Kamera {
  id_kamera: string;
  id_zona: string;
  nama_kamera: string;
  url_stream: string;
  status: string; // 'AKTIF' | 'NONAKTIF'
  waktu_dibuat?: string;
  waktu_diperbarui?: string;
}

// --- Kamera Endpoints ---
export const getKamera = async (params?: any): Promise<Kamera[]> => {
  const response = await serverAPI.get('/kamera', { params });
  return response.data.data || response.data;
};

export const getKameraById = async (id: string): Promise<Kamera> => {
  const response = await serverAPI.get(`/kamera/${id}`);
  return response.data.data || response.data;
};

export const createKamera = async (data: any): Promise<Kamera> => {
  const response = await serverAPI.post('/kamera', data);
  return response.data.data || response.data;
};

export const updateKamera = async (id: string, data: any): Promise<Kamera> => {
  const response = await serverAPI.put(`/kamera/${id}`, data);
  return response.data.data || response.data;
};

export const deleteKamera = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/kamera/${id}`);
  return response.data;
};
