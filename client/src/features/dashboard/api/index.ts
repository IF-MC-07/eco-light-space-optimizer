import { serverAPI } from '@/lib/api';
import type { EnergyLog, DetectionLog, LightControl, ACControl } from '@/types';

// --- Energy Log Endpoints ---
export const getEnergyLogs = async (params?: any): Promise<EnergyLog[]> => {
  const response = await serverAPI.get('/energy-logs', { params });
  return response.data.data || response.data;
};

export const getEnergyLogById = async (id: string): Promise<EnergyLog> => {
  const response = await serverAPI.get(`/energy-logs/${id}`);
  return response.data.data || response.data;
};

export const createEnergyLog = async (data: any): Promise<EnergyLog> => {
  const response = await serverAPI.post('/energy-logs', data);
  return response.data.data || response.data;
};

// --- Detection Log Endpoints ---
export const getDetectionLogs = async (params?: any): Promise<DetectionLog[]> => {
  const response = await serverAPI.get('/detection-logs', { params });
  return response.data.data || response.data;
};

export const getDetectionLogById = async (id: string): Promise<DetectionLog> => {
  const response = await serverAPI.get(`/detection-logs/${id}`);
  return response.data.data || response.data;
};

export const createDetectionLog = async (data: any): Promise<DetectionLog> => {
  const response = await serverAPI.post('/detection-logs', data);
  return response.data.data || response.data;
};

// --- Light Control Endpoints ---
export const getLightControls = async (params?: any): Promise<LightControl[]> => {
  const response = await serverAPI.get('/light-controls', { params });
  return response.data.data || response.data;
};

export const createLightControl = async (data: any): Promise<LightControl> => {
  const response = await serverAPI.post('/light-controls', data);
  return response.data.data || response.data;
};

// --- AC Control Endpoints ---
export const getACControls = async (params?: any): Promise<ACControl[]> => {
  const response = await serverAPI.get('/ac-controls', { params });
  return response.data.data || response.data;
};

export const createACControl = async (data: any): Promise<ACControl> => {
  const response = await serverAPI.post('/ac-controls', data);
  return response.data.data || response.data;
};

// --- Activity Log Endpoints ---
export interface ActivityLog {
  log_id: string;
  user_id: string | null;
  action: string;
  details: string | null;
  timestamp: string;
  ip_address: string | null;
  status_code: number | null;
  resource_id: string | null;
  resource_type: string | null;
  User?: {
    name: string;
    username: string;
  };
}

export const getActivityLogs = async (params?: any): Promise<ActivityLog[]> => {
  const response = await serverAPI.get('/activity-logs', { params });
  return response.data.data || response.data;
};
