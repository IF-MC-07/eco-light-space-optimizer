import { useQuery } from '@tanstack/react-query';
import { energyApi } from '../api';

export const useEnergySummary = (filters?: any) => {
  return useQuery({
    queryKey: ['energy', 'summary', filters],
    queryFn: () => energyApi.getSummary(filters),
    refetchInterval: 5000, // Poll real-time power every 5s
    refetchIntervalInBackground: true,
    staleTime: 0, 
  });
};

export const useEnergyLogs = (filters?: any) => {
  return useQuery({
    queryKey: ['energy', 'logs', filters],
    queryFn: () => energyApi.getLogs(filters),
  });
};

export const useEnergyBreakdown = (filters?: any) => {
  return useQuery({
    queryKey: ['energy', 'breakdown', filters],
    queryFn: () => energyApi.getBreakdown(filters),
  });
};

export const usePowerSensors = () => {
  return useQuery({
    queryKey: ['power-sensors'],
    queryFn: () => energyApi.getPowerSensors(),
    refetchInterval: 5000, // Poll real-time sensors every 5s
    refetchIntervalInBackground: true,
    staleTime: 0,
  });
};
