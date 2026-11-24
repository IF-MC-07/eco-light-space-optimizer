import { serverAPI } from '@/lib/api';
import type { ApiResponse } from '@/features/rooms/types';
import type { RoomOccupancy, OccupancyListParams } from '../types';

export const occupancyApi = {
  getAll: async (params?: OccupancyListParams): Promise<ApiResponse<RoomOccupancy[]>> => {
    const response = await serverAPI.get('/occupancy', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<RoomOccupancy>> => {
    const response = await serverAPI.get(`/occupancy/${id}`);
    return response.data;
  },
};

