import { serverAPI } from '@/lib/api';

// --- Types ---
export interface JadwalOtomatisasi {
  id_jadwal: string;
  id_perangkat: string;
  waktu_mulai: string;
  waktu_selesai: string;
  hari: string; // Misal: '1,2,3,4,5' untuk hari kerja
  status: string; // 'AKTIF' | 'NONAKTIF'
  waktu_dibuat?: string;
  waktu_diperbarui?: string;
}

// --- Jadwal Otomatisasi Endpoints ---
export const getJadwalOtomatisasi = async (params?: any): Promise<JadwalOtomatisasi[]> => {
  const response = await serverAPI.get('/jadwal-otomatisasi', { params });
  return response.data.data || response.data;
};

export const getJadwalOtomatisasiById = async (id: string): Promise<JadwalOtomatisasi> => {
  const response = await serverAPI.get(`/jadwal-otomatisasi/${id}`);
  return response.data.data || response.data;
};

export const createJadwalOtomatisasi = async (data: any): Promise<JadwalOtomatisasi> => {
  const response = await serverAPI.post('/jadwal-otomatisasi', data);
  return response.data.data || response.data;
};

export const updateJadwalOtomatisasi = async (id: string, data: any): Promise<JadwalOtomatisasi> => {
  const response = await serverAPI.put(`/jadwal-otomatisasi/${id}`, data);
  return response.data.data || response.data;
};

export const deleteJadwalOtomatisasi = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/jadwal-otomatisasi/${id}`);
  return response.data;
};
