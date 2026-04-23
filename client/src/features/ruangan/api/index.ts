import { serverAPI } from '@/lib/api';

// --- Types ---
export interface Ruangan {
  id_ruangan: string;
  nama_ruangan: string;
  deskripsi?: string;
  waktu_dibuat?: string;
  waktu_diperbarui?: string;
}

// --- Ruangan Endpoints ---
export const getRuangan = async (params?: any): Promise<Ruangan[]> => {
  const response = await serverAPI.get('/ruangan', { params });
  return response.data.data || response.data;
};

export const getRuanganById = async (id: string): Promise<Ruangan> => {
  const response = await serverAPI.get(`/ruangan/${id}`);
  return response.data.data || response.data;
};

export const createRuangan = async (data: any): Promise<Ruangan> => {
  const response = await serverAPI.post('/ruangan', data);
  return response.data.data || response.data;
};

export const updateRuangan = async (id: string, data: any): Promise<Ruangan> => {
  const response = await serverAPI.put(`/ruangan/${id}`, data);
  return response.data.data || response.data;
};

export const deleteRuangan = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/ruangan/${id}`);
  return response.data;
};
