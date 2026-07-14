import { serverAPI } from '@/lib/api';
import type { ApiResponse, EnergySummary, EnergyLogData, EnergyBreakdown, PowerSensorData } from '../types';

export const energyApi = {
  getSummary: async (): Promise<ApiResponse<EnergySummary>> => {
    const response = await serverAPI.get('/energy/summary');
    return response.data.data || response.data;
  },

  getLogs: async (filters?: any): Promise<ApiResponse<EnergyLogData[]>> => {
    const response = await serverAPI.get('/energy/logs', { params: filters });
    return response.data.data || response.data;
  },

  getBreakdown: async (): Promise<ApiResponse<EnergyBreakdown[]>> => {
    const response = await serverAPI.get('/energy/breakdown');
    return response.data.data || response.data;
  },

  getPowerSensors: async (): Promise<ApiResponse<PowerSensorData[]>> => {
    const response = await serverAPI.get('/power-sensors');
    return response.data.data || response.data;
  }
};
