import { serverAPI } from '@/lib/api';
import type { PowerSensor } from '@/types';

// --- Power Sensor Endpoints ---
export const getPowerSensors = async (params?: any): Promise<PowerSensor[]> => {
  const response = await serverAPI.get('/power-sensors', { params });
  return response.data.data || response.data;
};

export const getPowerSensorById = async (id: string): Promise<PowerSensor> => {
  const response = await serverAPI.get(`/power-sensors/${id}`);
  return response.data.data || response.data;
};

export const createPowerSensor = async (data: any): Promise<PowerSensor> => {
  const response = await serverAPI.post('/power-sensors', data);
  return response.data.data || response.data;
};

export const updatePowerSensor = async (id: string, data: any): Promise<PowerSensor> => {
  const response = await serverAPI.put(`/power-sensors/${id}`, data);
  return response.data.data || response.data;
};

export const deletePowerSensor = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/power-sensors/${id}`);
  return response.data;
};
