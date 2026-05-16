import { serverAPI } from '@/lib/api';
import { AutomationSchedule, ApiResponse } from '../types';

export const automationApi = {
  getAll: async (): Promise<ApiResponse<AutomationSchedule[]>> => {
    const response = await serverAPI.get('/automation-schedules');
    return response.data;
  },
  
  getById: async (id: string): Promise<ApiResponse<AutomationSchedule>> => {
    const response = await serverAPI.get(`/automation-schedules/${id}`);
    return response.data;
  },

  create: async (payload: Partial<AutomationSchedule>): Promise<ApiResponse<AutomationSchedule>> => {
    const response = await serverAPI.post('/automation-schedules', payload);
    return response.data;
  },

  update: async (id: number, payload: Partial<AutomationSchedule>): Promise<ApiResponse<AutomationSchedule>> => {
    const response = await serverAPI.put(`/automation-schedules/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<ApiResponse<void>> => {
    const response = await serverAPI.delete(`/automation-schedules/${id}`);
    return response.data;
  }
};
