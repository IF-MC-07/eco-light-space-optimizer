import { serverAPI } from '@/lib/api';
import type { ApiResponse, SavingsSummary, SavingsBreakdown, SavingsTrend, YoYComparisonData, PowerStatsData } from '../types';

export const savingsApi = {
  getSummary: async (filters?: any): Promise<SavingsSummary> => {
    const response = await serverAPI.get('/savings/summary', { params: filters });
    return response.data.data || response.data;
  },

  getBreakdown: async (filters?: any): Promise<SavingsBreakdown[]> => {
    const response = await serverAPI.get('/savings/breakdown', { params: filters });
    return response.data.data || response.data;
  },

  getTrend: async (filters?: any): Promise<SavingsTrend[]> => {
    const response = await serverAPI.get('/savings/trend', { params: filters });
    return response.data.data || response.data;
  },

  getYoY: async (filters?: any): Promise<YoYComparisonData> => {
    const response = await serverAPI.get('/savings/yoy', { params: filters });
    return response.data.data || response.data;
  },

  getPowerStats: async (): Promise<PowerStatsData> => {
    const response = await serverAPI.get('/savings/power-stats');
    return response.data.data || response.data;
  }
};
