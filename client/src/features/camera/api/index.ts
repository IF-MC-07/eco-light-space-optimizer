import { serverAPI } from '@/lib/api';

// --- Types ---
export interface Kamera {
  id_camera: string;
  id_zona: string;
  nama_camera: string;
  url_stream: string;
  status: string; // 'AKTIF' | 'NONAKTIF'
  waktu_dibuat?: string;
  waktu_diperbarui?: string;
}

// --- Kamera Endpoints ---
export const getKamera = async (params?: any): Promise<Kamera[]> => {
  const response = await serverAPI.get('/camera', { params });
  return response.data.data || response.data;
};

export const getKameraById = async (id: string): Promise<Kamera> => {
  const response = await serverAPI.get(`/camera/${id}`);
  return response.data.data || response.data;
};

export const createKamera = async (data: any): Promise<Kamera> => {
  const response = await serverAPI.post('/camera', data);
  return response.data.data || response.data;
};

export const updateKamera = async (id: string, data: any): Promise<Kamera> => {
  const response = await serverAPI.put(`/camera/${id}`, data);
  return response.data.data || response.data;
};

export const deleteKamera = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/camera/${id}`);
  return response.data;
};
