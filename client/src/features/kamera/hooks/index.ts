import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export const kameraKeys = {
  all: ['kamera'] as const,
  lists: () => [...kameraKeys.all, 'list'] as const,
  list: (params?: any) => [...kameraKeys.lists(), params] as const,
  details: () => [...kameraKeys.all, 'detail'] as const,
  detail: (id: string) => [...kameraKeys.details(), id] as const,
};

// --- Kamera Hooks ---
export const useKameraList = (params?: any) => {
  return useQuery({
    queryKey: kameraKeys.list(params),
    queryFn: () => api.getKamera(params),
  });
};

export const useKameraDetail = (id: string) => {
  return useQuery({
    queryKey: kameraKeys.detail(id),
    queryFn: () => api.getKameraById(id),
    enabled: !!id,
  });
};

export const useCreateKamera = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createKamera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kameraKeys.lists() });
    },
  });
};

export const useUpdateKamera = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateKamera(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: kameraKeys.lists() });
      queryClient.invalidateQueries({ queryKey: kameraKeys.detail(variables.id) });
    },
  });
};

export const useDeleteKamera = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteKamera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kameraKeys.lists() });
    },
  });
};
