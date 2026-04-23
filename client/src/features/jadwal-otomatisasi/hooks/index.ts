import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export const jadwalOtomatisasiKeys = {
  all: ['jadwal-otomatisasi'] as const,
  lists: () => [...jadwalOtomatisasiKeys.all, 'list'] as const,
  list: (params?: any) => [...jadwalOtomatisasiKeys.lists(), params] as const,
  details: () => [...jadwalOtomatisasiKeys.all, 'detail'] as const,
  detail: (id: string) => [...jadwalOtomatisasiKeys.details(), id] as const,
};

// --- Jadwal Otomatisasi Hooks ---
export const useJadwalOtomatisasiList = (params?: any) => {
  return useQuery({
    queryKey: jadwalOtomatisasiKeys.list(params),
    queryFn: () => api.getJadwalOtomatisasi(params),
  });
};

export const useJadwalOtomatisasiDetail = (id: string) => {
  return useQuery({
    queryKey: jadwalOtomatisasiKeys.detail(id),
    queryFn: () => api.getJadwalOtomatisasiById(id),
    enabled: !!id,
  });
};

export const useCreateJadwalOtomatisasi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createJadwalOtomatisasi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jadwalOtomatisasiKeys.lists() });
    },
  });
};

export const useUpdateJadwalOtomatisasi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateJadwalOtomatisasi(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: jadwalOtomatisasiKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jadwalOtomatisasiKeys.detail(variables.id) });
    },
  });
};

export const useDeleteJadwalOtomatisasi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteJadwalOtomatisasi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jadwalOtomatisasiKeys.lists() });
    },
  });
};
