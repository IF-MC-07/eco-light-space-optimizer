import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export const cameraKeys = {
  all: ['cameras'] as const,
  lists: () => [...cameraKeys.all, 'list'] as const,
  list: (params?: any) => [...cameraKeys.lists(), params] as const,
  details: () => [...cameraKeys.all, 'detail'] as const,
  detail: (id: string) => [...cameraKeys.details(), id] as const,
};

// --- Camera Hooks ---
export const useCameraList = (params?: any) => {
  return useQuery({
    queryKey: cameraKeys.list(params),
    queryFn: () => api.getCameras(params),
  });
};

export const useCameraDetail = (id: string) => {
  return useQuery({
    queryKey: cameraKeys.detail(id),
    queryFn: () => api.getCameraById(id),
    enabled: !!id,
  });
};

export const useCreateCamera = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createCamera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cameraKeys.lists() });
    },
  });
};

export const useUpdateCamera = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateCamera(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cameraKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cameraKeys.detail(variables.id) });
    },
  });
};

export const useDeleteCamera = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCamera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cameraKeys.lists() });
    },
  });
};
