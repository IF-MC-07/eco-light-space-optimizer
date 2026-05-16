import { serverAPI } from '@/lib/api';
import { IotDevice, ApiResponse } from '../types';

export const iotDeviceApi = {
  getAll: async (roomId?: string): Promise<ApiResponse<IotDevice[]>> => {
    const response = await serverAPI.get('/iot-devices', {
      params: roomId ? { room_id: roomId } : {}
    });
    return response.data;
  },
  
  getById: async (id: string): Promise<ApiResponse<IotDevice>> => {
    const response = await serverAPI.get(`/iot-devices/${id}`);
    return response.data;
  },

  create: async (payload: Partial<IotDevice>): Promise<ApiResponse<IotDevice>> => {
    const response = await serverAPI.post('/iot-devices', payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<IotDevice>): Promise<ApiResponse<IotDevice>> => {
    const response = await serverAPI.put(`/iot-devices/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<ApiResponse<void>> => {
    const response = await serverAPI.delete(`/iot-devices/${id}`);
    return response.data;
  }
};
