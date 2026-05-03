import { serverAPI } from '@/lib/api';
import { AutomationSchedule } from '@/types';

// --- Automation Schedule Endpoints ---
export const getAutomationSchedules = async (params?: any): Promise<AutomationSchedule[]> => {
  const response = await serverAPI.get('/automation-schedules', { params });
  return response.data.data || response.data;
};

export const getAutomationScheduleById = async (id: string): Promise<AutomationSchedule> => {
  const response = await serverAPI.get(`/automation-schedules/${id}`);
  return response.data.data || response.data;
};

export const createAutomationSchedule = async (data: any): Promise<AutomationSchedule> => {
  const response = await serverAPI.post('/automation-schedules', data);
  return response.data.data || response.data;
};

export const updateAutomationSchedule = async (id: string, data: any): Promise<AutomationSchedule> => {
  const response = await serverAPI.put(`/automation-schedules/${id}`, data);
  return response.data.data || response.data;
};

export const deleteAutomationSchedule = async (id: string): Promise<any> => {
  const response = await serverAPI.delete(`/automation-schedules/${id}`);
  return response.data;
};
