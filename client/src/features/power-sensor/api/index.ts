import { serverAPI } from '@/lib/api';

// --- Types ---
export interface SensorDaya {
  id_sensor: string;
  id_zona: string;
  nama_sensor: string;
  status: string; // 'AKTIF' | 'NONAKTIF'
  waktu_dibuat?: string;
  waktu_diperbarui?: string;
}

// --- Sensor Daya Endpoints ---
export const getSensorDaya = async (params?: any): Promise<SensorDaya[]> => {
  const response = await serverAPI.get('/power-sensor', { params });
  return response.data.data || response.data;
};

export const getSensorDayaById = async (id: string): Promise<SensorDaya> => {
  const response = await serverAPI.get(`/power-sensor/${id}`);
  return response.data.data || response.data;
};

export const createSensorDaya = async (data: any): Promise<SensorDaya> => {
  const response = await serverAPI.post('/power-sensor', data);
  return response.data.data || response.data;
};

export const updateSensorDaya = async (id: string, data: any): Promise<SensorDaya> => {
  const response = await serverAPI.put(`/power-sensor/${id}`, data);
  return response.data.data || response.data;
};

export const deleteSensorDaya = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/power-sensor/${id}`);
  return response.data;
};
