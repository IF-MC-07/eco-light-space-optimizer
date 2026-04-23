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

// --- Log Energi Hooks ---
export const useLogEnergiList = (params?: any) => {
  return useQuery({
    queryKey: dashboardKeys.logEnergiList(params),
    queryFn: () => api.getLogEnergi(params),
  });
};

export const useLogEnergiDetail = (id: string) => {
  return useQuery({
    queryKey: dashboardKeys.logEnergiDetail(id),
    queryFn: () => api.getLogEnergiById(id),
    enabled: !!id,
  });
};

export const useCreateLogEnergi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createLogEnergi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};

// --- Log Deteksi Hooks ---
export const useLogDeteksiList = (params?: any) => {
  return useQuery({
    queryKey: dashboardKeys.logDeteksiList(params),
    queryFn: () => api.getLogDeteksi(params),
  });
};

export const useLogDeteksiDetail = (id: string) => {
  return useQuery({
    queryKey: dashboardKeys.logDeteksiDetail(id),
    queryFn: () => api.getLogDeteksiById(id),
    enabled: !!id,
  });
};

export const useCreateLogDeteksi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createLogDeteksi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};

// --- Kontrol Lampu Hooks ---
export const useKontrolLampuList = (params?: any) => {
  return useQuery({
    queryKey: dashboardKeys.kontrolLampuList(params),
    queryFn: () => api.getKontrolLampu(params),
  });
};

export const useCreateKontrolLampu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createKontrolLampu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};

// --- Kontrol AC Hooks ---
export const useKontrolACList = (params?: any) => {
  return useQuery({
    queryKey: dashboardKeys.kontrolACList(params),
    queryFn: () => api.getKontrolAC(params),
  });
};

export const useCreateKontrolAC = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createKontrolAC,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};
