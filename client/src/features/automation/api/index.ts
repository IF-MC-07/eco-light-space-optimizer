import { serverAPI } from '@/lib/api';
import type { AutomationSchedule, ApiResponse } from '../types';

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

  update: async (id: string, payload: Partial<AutomationSchedule>): Promise<ApiResponse<AutomationSchedule>> => {
    const response = await serverAPI.put(`/automation-schedules/${id}`, payload);
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<{ total_schedules: number, active_schedules: number, efficiency_score: number, automation_rate: number }>> => {
    const response = await serverAPI.get('/automation-schedules/stats');
    return response.data;
  },

  remove: async (id: string): Promise<ApiResponse<void>> => {
    const response = await serverAPI.delete(`/automation-schedules/${id}`);
    return response.data;
  },

  removeAll: async (): Promise<ApiResponse<{ deletedCount: number }>> => {
    const response = await serverAPI.delete('/automation-schedules');
    return response.data;
  }
};
