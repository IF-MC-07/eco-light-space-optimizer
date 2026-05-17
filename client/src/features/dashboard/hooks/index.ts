import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  logEnergiList: (params?: any) => [...dashboardKeys.all, 'log-energi', params] as const,
  logEnergiDetail: (id: string) => [...dashboardKeys.all, 'log-energi', id] as const,
  logDeteksiList: (params?: any) => [...dashboardKeys.all, 'log-deteksi', params] as const,
  logDeteksiDetail: (id: string) => [...dashboardKeys.all, 'log-deteksi', id] as const,
  kontrolLampuList: (params?: any) => [...dashboardKeys.all, 'kontrol-lampu', params] as const,
  kontrolACList: (params?: any) => [...dashboardKeys.all, 'kontrol-ac', params] as const,
};

export const useLogEnergiList = (params?: any) => {
  return useQuery({
    queryKey: dashboardKeys.logEnergiList(params),
    queryFn: () => api.getEnergyLogs(params),
  });
};

export const useLogEnergiDetail = (id: string) => {
  return useQuery({
    queryKey: dashboardKeys.logEnergiDetail(id),
    queryFn: () => api.getEnergyLogById(id),
    enabled: !!id,
  });
};

export const useCreateLogEnergi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createEnergyLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};

export const useLogDeteksiList = (params?: any) => {
  return useQuery({
    queryKey: dashboardKeys.logDeteksiList(params),
    queryFn: () => api.getDetectionLogs(params),
  });
};

export const useLogDeteksiDetail = (id: string) => {
  return useQuery({
    queryKey: dashboardKeys.logDeteksiDetail(id),
    queryFn: () => api.getDetectionLogById(id),
    enabled: !!id,
  });
};

export const useCreateLogDeteksi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createDetectionLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};

export const useControlLampuList = (params?: any) => {
  return useQuery({
    queryKey: dashboardKeys.kontrolLampuList(params),
    queryFn: () => api.getLightControls(params),
  });
};

export const useCreateKontrolLampu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createLightControl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};

export const useControlACList = (params?: any) => {
  return useQuery({
    queryKey: dashboardKeys.kontrolACList(params),
    queryFn: () => api.getACControls(params),
  });
};

export const useCreateKontrolAC = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createACControl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};
