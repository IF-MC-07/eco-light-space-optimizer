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
export const useZoneList = (params?: any) => {
  return useQuery({
    queryKey: zonaKeys.list(params),
    queryFn: () => api.getZones(params),
  });
};

export const useZoneDetail = (id: string) => {
  return useQuery({
    queryKey: zonaKeys.detail(id),
    queryFn: () => api.getZoneById(id),
    enabled: !!id,
  });
};

export const useCreateZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zonaKeys.lists() });
    },
  });
};

export const useUpdateZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateZone(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: zonaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: zonaKeys.detail(variables.id) });
    },
  });
};

export const useDeleteZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zonaKeys.lists() });
    },
  });
};
