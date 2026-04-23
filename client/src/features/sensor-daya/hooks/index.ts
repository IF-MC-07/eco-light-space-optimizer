import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export const sensorDayaKeys = {
  all: ['sensor-daya'] as const,
  lists: () => [...sensorDayaKeys.all, 'list'] as const,
  list: (params?: any) => [...sensorDayaKeys.lists(), params] as const,
  details: () => [...sensorDayaKeys.all, 'detail'] as const,
  detail: (id: string) => [...sensorDayaKeys.details(), id] as const,
};

// --- Sensor Daya Hooks ---
export const useSensorDayaList = (params?: any) => {
  return useQuery({
    queryKey: sensorDayaKeys.list(params),
    queryFn: () => api.getSensorDaya(params),
  });
};

export const useSensorDayaDetail = (id: string) => {
  return useQuery({
    queryKey: sensorDayaKeys.detail(id),
    queryFn: () => api.getSensorDayaById(id),
    enabled: !!id,
  });
};

export const useCreateSensorDaya = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createSensorDaya,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sensorDayaKeys.lists() });
    },
  });
};

export const useUpdateSensorDaya = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateSensorDaya(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sensorDayaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sensorDayaKeys.detail(variables.id) });
    },
  });
};

export const useDeleteSensorDaya = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteSensorDaya,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sensorDayaKeys.lists() });
    },
  });
};
