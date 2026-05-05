import { serverAPI } from '@/lib/api';
import { 
  Room, RoomFilters, RoomStats, CreateRoomPayload, UpdateRoomPayload,
  Device, CreateDevicePayload, UpdateDevicePayload,
  Schedule, CreateSchedulePayload, UpdateSchedulePayload,
  ApiResponse 
} from '../types';

export const roomsApi = {
  getAll: async (filters?: RoomFilters): Promise<ApiResponse<Room[]>> => {
    const response = await serverAPI.get('/rooms', { params: filters });
    return response.data;
  },
  
  getById: async (id: string): Promise<ApiResponse<Room>> => {
    const response = await serverAPI.get(`/rooms/${id}`);
    return response.data;
  },

  create: async (payload: CreateRoomPayload): Promise<ApiResponse<Room>> => {
    const response = await serverAPI.post('/rooms', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateRoomPayload): Promise<ApiResponse<Room>> => {
    const response = await serverAPI.put(`/rooms/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<ApiResponse<void>> => {
    const response = await serverAPI.delete(`/rooms/${id}`);
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<RoomStats>> => {
    const response = await serverAPI.get('/rooms/stats');
    return response.data;
  }
};

export const devicesApi = {
  getByRoom: async (roomId: string): Promise<ApiResponse<Device[]>> => {
    const response = await serverAPI.get(`/devices/room/${roomId}`);
    return response.data;
  },

  create: async (payload: CreateDevicePayload): Promise<ApiResponse<Device>> => {
    const response = await serverAPI.post('/devices', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateDevicePayload): Promise<ApiResponse<Device>> => {
    const response = await serverAPI.put(`/devices/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<ApiResponse<void>> => {
    const response = await serverAPI.delete(`/devices/${id}`);
    return response.data;
  },

  provision: async (id: string): Promise<ApiResponse<Device>> => {
    const response = await serverAPI.post(`/devices/${id}/provision`);
    return response.data;
  }
};

export const schedulesApi = {
  getByDevice: async (deviceId: string): Promise<ApiResponse<Schedule[]>> => {
    const response = await serverAPI.get(`/schedules/device/${deviceId}`);
    return response.data;
  },

  create: async (payload: CreateSchedulePayload): Promise<ApiResponse<Schedule>> => {
    const response = await serverAPI.post('/schedules', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateSchedulePayload): Promise<ApiResponse<Schedule>> => {
    const response = await serverAPI.put(`/schedules/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<ApiResponse<void>> => {
    const response = await serverAPI.delete(`/schedules/${id}`);
    return response.data;
  },

  toggleActive: async (id: string): Promise<ApiResponse<Schedule>> => {
    const response = await serverAPI.patch(`/schedules/${id}/toggle`);
    return response.data;
  }
};
