import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export const ruanganKeys = {
  all: ['ruangan'] as const,
  lists: () => [...ruanganKeys.all, 'list'] as const,
  list: (params?: any) => [...ruanganKeys.lists(), params] as const,
  details: () => [...ruanganKeys.all, 'detail'] as const,
  detail: (id: string) => [...ruanganKeys.details(), id] as const,
};

// --- Ruangan Hooks ---
export const useRuanganList = (params?: any) => {
  return useQuery({
    queryKey: ruanganKeys.list(params),
    queryFn: () => api.getRuangan(params),
  });
};

export const useRuanganDetail = (id: string) => {
  return useQuery({
    queryKey: ruanganKeys.detail(id),
    queryFn: () => api.getRuanganById(id),
    enabled: !!id,
  });
};

export const useCreateRuangan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createRuangan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ruanganKeys.lists() });
    },
  });
};

export const useUpdateRuangan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateRuangan(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ruanganKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ruanganKeys.detail(variables.id) });
    },
  });
};

export const useDeleteRuangan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteRuangan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ruanganKeys.lists() });
    },
  });
};
