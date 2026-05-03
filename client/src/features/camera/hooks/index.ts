import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export const cameraKeys = {
  all: ['camera'] as const,
  lists: () => [...cameraKeys.all, 'list'] as const,
  list: (params?: any) => [...cameraKeys.lists(), params] as const,
  details: () => [...cameraKeys.all, 'detail'] as const,
  detail: (id: string) => [...cameraKeys.details(), id] as const,
};

// --- Kamera Hooks ---
export const useKameraList = (params?: any) => {
  return useQuery({
    queryKey: cameraKeys.list(params),
    queryFn: () => api.getKamera(params),
  });
};

export const useKameraDetail = (id: string) => {
  return useQuery({
    queryKey: cameraKeys.detail(id),
    queryFn: () => api.getKameraById(id),
    enabled: !!id,
  });
};

export const useCreateKamera = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createKamera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cameraKeys.lists() });
    },
  });
};

export const useUpdateKamera = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateKamera(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cameraKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cameraKeys.detail(variables.id) });
    },
  });
};

export const useDeleteKamera = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteKamera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cameraKeys.lists() });
    },
  });
};
