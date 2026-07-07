import { useQuery } from '@tanstack/react-query';
import { savingsApi } from '../api';

export const useSavingsSummary = () => {
  return useQuery({
    queryKey: ['savings', 'summary'],
    queryFn: () => savingsApi.getSummary(),
  });
};

export const useSavingsBreakdown = () => {
  return useQuery({
    queryKey: ['savings', 'breakdown'],
    queryFn: () => savingsApi.getBreakdown(),
  });
};

export const useSavingsTrend = () => {
  return useQuery({
    queryKey: ['savings', 'trend'],
    queryFn: () => savingsApi.getTrend(),
  });
};

export const useSavingsYoY = () => {
  return useQuery({
    queryKey: ['savings', 'yoy'],
    queryFn: () => savingsApi.getYoY(),
  });
};

export const usePowerStats = () => {
  return useQuery({
    queryKey: ['savings', 'power-stats'],
    queryFn: () => savingsApi.getPowerStats(),
  });
};
