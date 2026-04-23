import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export const perangkatIotKeys = {
  all: ['perangkat-iot'] as const,
  lists: () => [...perangkatIotKeys.all, 'list'] as const,
  list: (params?: any) => [...perangkatIotKeys.lists(), params] as const,
  details: () => [...perangkatIotKeys.all, 'detail'] as const,
  detail: (id: string) => [...perangkatIotKeys.details(), id] as const,
};

// --- Perangkat IoT Hooks ---
export const usePerangkatIoTList = (params?: any) => {
  return useQuery({
    queryKey: perangkatIotKeys.list(params),
    queryFn: () => api.getPerangkatIoT(params),
  });
};

export const usePerangkatIoTDetail = (id: string) => {
  return useQuery({
    queryKey: perangkatIotKeys.detail(id),
    queryFn: () => api.getPerangkatIoTById(id),
    enabled: !!id,
  });
};

export const useCreatePerangkatIoT = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPerangkatIoT,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: perangkatIotKeys.lists() });
    },
  });
};

export const useUpdatePerangkatIoT = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updatePerangkatIoT(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: perangkatIotKeys.lists() });
      queryClient.invalidateQueries({ queryKey: perangkatIotKeys.detail(variables.id) });
    },
  });
};

export const useDeletePerangkatIoT = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deletePerangkatIoT,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: perangkatIotKeys.lists() });
    },
  });
};
