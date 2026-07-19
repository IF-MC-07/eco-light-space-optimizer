import { useQuery } from '@tanstack/react-query';
import { energyApi } from '../api';

export const useEnergySummary = () => {
  return useQuery({
    queryKey: ['energy', 'summary'],
    queryFn: () => energyApi.getSummary(),
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

export const useEnergyBreakdown = () => {
  return useQuery({
    queryKey: ['energy', 'breakdown'],
    queryFn: () => energyApi.getBreakdown(),
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
