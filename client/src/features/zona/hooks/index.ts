import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export const zonaKeys = {
  all: ['zona'] as const,
  lists: () => [...zonaKeys.all, 'list'] as const,
  list: (params?: any) => [...zonaKeys.lists(), params] as const,
  details: () => [...zonaKeys.all, 'detail'] as const,
  detail: (id: string) => [...zonaKeys.details(), id] as const,
};

// --- Zona Hooks ---
export const useZonaList = (params?: any) => {
  return useQuery({
    queryKey: zonaKeys.list(params),
    queryFn: () => api.getZona(params),
  });
};

export const useZonaDetail = (id: string) => {
  return useQuery({
    queryKey: zonaKeys.detail(id),
    queryFn: () => api.getZonaById(id),
    enabled: !!id,
  });
};

export const useCreateZona = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createZona,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zonaKeys.lists() });
    },
  });
};

export const useUpdateZona = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateZona(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: zonaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: zonaKeys.detail(variables.id) });
    },
  });
};

export const useDeleteZona = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteZona,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zonaKeys.lists() });
    },
  });
};
