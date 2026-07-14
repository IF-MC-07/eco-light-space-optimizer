import { serverAPI } from '@/lib/api';
import type { ApiResponse, SavingsSummary, SavingsBreakdown, SavingsTrend, YoYComparisonData, PowerStatsData } from '../types';

export const savingsApi = {
  getSummary: async (): Promise<ApiResponse<SavingsSummary>> => {
    const response = await serverAPI.get('/savings/summary');
    return response.data.data || response.data;
  },

  getBreakdown: async (): Promise<ApiResponse<SavingsBreakdown[]>> => {
    const response = await serverAPI.get('/savings/breakdown');
    return response.data.data || response.data;
  },

  getTrend: async (): Promise<ApiResponse<SavingsTrend[]>> => {
    const response = await serverAPI.get('/savings/trend');
    return response.data.data || response.data;
  },

  getYoY: async (): Promise<ApiResponse<YoYComparisonData>> => {
    const response = await serverAPI.get('/savings/yoy');
    return response.data.data || response.data;
  },

  getPowerStats: async (): Promise<ApiResponse<PowerStatsData>> => {
    const response = await serverAPI.get('/savings/power-stats');
    return response.data.data || response.data;
  }
};
