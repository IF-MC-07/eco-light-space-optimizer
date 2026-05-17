import { serverAPI } from '@/lib/api';
import type { ApiResponse, SavingsSummary, SavingsBreakdown, SavingsTrend, YoYComparisonData } from '../types';

export const savingsApi = {
  getSummary: async (): Promise<ApiResponse<SavingsSummary>> => {
    const response = await serverAPI.get('/savings/summary');
    return response.data;
  },

  getBreakdown: async (): Promise<ApiResponse<SavingsBreakdown[]>> => {
    const response = await serverAPI.get('/savings/breakdown');
    return response.data;
  },

  getTrend: async (): Promise<ApiResponse<SavingsTrend[]>> => {
    const response = await serverAPI.get('/savings/trend');
    return response.data;
  },

  getYoY: async (): Promise<ApiResponse<YoYComparisonData>> => {
    const response = await serverAPI.get('/savings/yoy');
    return response.data;
  }
};
