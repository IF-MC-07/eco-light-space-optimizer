import { useQuery } from '@tanstack/react-query';
import { savingsApi } from '../api';

const REALTIME_OPTIONS = {
  refetchInterval: 30000,      // polling ulang tiap 30 detik
  refetchOnWindowFocus: true,  // refresh saat tab kembali aktif
};

export const useSavingsSummary = (filters?: any) => {
  return useQuery({
    queryKey: ['savings', 'summary', filters],
    queryFn: () => savingsApi.getSummary(filters),
    ...REALTIME_OPTIONS,
  });
};

export const useSavingsBreakdown = (filters?: any) => {
  return useQuery({
    queryKey: ['savings', 'breakdown', filters],
    queryFn: () => savingsApi.getBreakdown(filters),
    ...REALTIME_OPTIONS,
  });
};

export const useSavingsTrend = (filters?: any) => {
  return useQuery({
    queryKey: ['savings', 'trend', filters],
    queryFn: () => savingsApi.getTrend(filters),
    ...REALTIME_OPTIONS,
  });
};

export const useSavingsYoY = (filters?: any) => {
  return useQuery({
    queryKey: ['savings', 'yoy', filters],
    queryFn: () => savingsApi.getYoY(filters),
    ...REALTIME_OPTIONS,
  });
};

export const usePowerStats = () => {
  return useQuery({
    queryKey: ['savings', 'power-stats'],
    queryFn: () => savingsApi.getPowerStats(),
    ...REALTIME_OPTIONS,
  });
};