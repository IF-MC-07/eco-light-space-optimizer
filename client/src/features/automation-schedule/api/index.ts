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
  const response = await serverAPI.get('/automation-schedule', { params });
  return response.data.data || response.data;
};

export const getJadwalOtomatisasiById = async (id: string): Promise<JadwalOtomatisasi> => {
  const response = await serverAPI.get(`/automation-schedule/${id}`);
  return response.data.data || response.data;
};

export const createJadwalOtomatisasi = async (data: any): Promise<JadwalOtomatisasi> => {
  const response = await serverAPI.post('/automation-schedule', data);
  return response.data.data || response.data;
};

export const updateJadwalOtomatisasi = async (id: string, data: any): Promise<JadwalOtomatisasi> => {
  const response = await serverAPI.put(`/automation-schedule/${id}`, data);
  return response.data.data || response.data;
};

export const deleteJadwalOtomatisasi = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/automation-schedule/${id}`);
  return response.data;
};
