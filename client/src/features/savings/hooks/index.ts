import { useQuery } from '@tanstack/react-query';
import { savingsApi } from '../api';

export const useSavingsSummary = (filters?: any) => {
  return useQuery({
    queryKey: ['savings', 'summary', filters],
    queryFn: () => savingsApi.getSummary(filters),
  });
};

export const useSavingsBreakdown = (filters?: any) => {
  return useQuery({
    queryKey: ['savings', 'breakdown', filters],
    queryFn: () => savingsApi.getBreakdown(filters),
  });
};

export const useSavingsTrend = (filters?: any) => {
  return useQuery({
    queryKey: ['savings', 'trend', filters],
    queryFn: () => savingsApi.getTrend(filters),
  });
};

export const useSavingsYoY = (filters?: any) => {
  return useQuery({
    queryKey: ['savings', 'yoy', filters],
    queryFn: () => savingsApi.getYoY(filters),
  });
};

export const usePowerStats = () => {
  return useQuery({
    queryKey: ['savings', 'power-stats'],
    queryFn: () => savingsApi.getPowerStats(),
  });
};
