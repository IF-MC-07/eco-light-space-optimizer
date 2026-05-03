import { serverAPI } from '@/lib/api';

// --- Types ---
export interface PerangkatIoT {
  id_perangkat: string;
  id_zona: string;
  nama_perangkat: string;
  jenis_perangkat: string; // 'LAMPU' | 'AC'
  status: string; // 'ON' | 'OFF'
  tingkat_kecerahan?: number;
  suhu?: number;
  waktu_dibuat?: string;
  waktu_diperbarui?: string;
}

// --- Perangkat IoT Endpoints ---
export const getPerangkatIoT = async (params?: any): Promise<PerangkatIoT[]> => {
  const response = await serverAPI.get('/iot-device', { params });
  return response.data.data || response.data;
};

export const getPerangkatIoTById = async (id: string): Promise<PerangkatIoT> => {
  const response = await serverAPI.get(`/iot-device/${id}`);
  return response.data.data || response.data;
};

export const createPerangkatIoT = async (data: any): Promise<PerangkatIoT> => {
  const response = await serverAPI.post('/iot-device', data);
  return response.data.data || response.data;
};

export const updatePerangkatIoT = async (id: string, data: any): Promise<PerangkatIoT> => {
  const response = await serverAPI.put(`/iot-device/${id}`, data);
  return response.data.data || response.data;
};

export const deletePerangkatIoT = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/iot-device/${id}`);
  return response.data;
};
