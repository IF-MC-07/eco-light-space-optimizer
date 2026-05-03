import { serverAPI } from '@/lib/api';
import { IoTDevice } from '@/types';

// --- IoT Device Endpoints ---
export const getIoTDevices = async (params?: any): Promise<IoTDevice[]> => {
  const response = await serverAPI.get('/iot-devices', { params });
  return response.data.data || response.data;
};

export const getIoTDeviceById = async (id: string): Promise<IoTDevice> => {
  const response = await serverAPI.get(`/iot-devices/${id}`);
  return response.data.data || response.data;
};

export const createIoTDevice = async (data: any): Promise<IoTDevice> => {
  const response = await serverAPI.post('/iot-devices', data);
  return response.data.data || response.data;
};

export const updateIoTDevice = async (id: string, data: any): Promise<IoTDevice> => {
  const response = await serverAPI.put(`/iot-devices/${id}`, data);
  return response.data.data || response.data;
};

export const deleteIoTDevice = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/iot-devices/${id}`);
  return response.data;
};
