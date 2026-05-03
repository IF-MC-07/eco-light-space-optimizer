import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export const powerSensorKeys = {
  all: ['power-sensors'] as const,
  lists: () => [...powerSensorKeys.all, 'list'] as const,
  list: (params?: any) => [...powerSensorKeys.lists(), params] as const,
  details: () => [...powerSensorKeys.all, 'detail'] as const,
  detail: (id: string) => [...powerSensorKeys.details(), id] as const,
};

// --- Power Sensor Hooks ---
export const usePowerSensorList = (params?: any) => {
  return useQuery({
    queryKey: powerSensorKeys.list(params),
    queryFn: () => api.getPowerSensors(params),
  });
};

export const usePowerSensorDetail = (id: string) => {
  return useQuery({
    queryKey: powerSensorKeys.detail(id),
    queryFn: () => api.getPowerSensorById(id),
    enabled: !!id,
  });
};

export const useCreatePowerSensor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPowerSensor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: powerSensorKeys.lists() });
    },
  });
};

export const useUpdatePowerSensor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updatePowerSensor(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: powerSensorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: powerSensorKeys.detail(variables.id) });
    },
  });
};

export const useDeletePowerSensor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deletePowerSensor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: powerSensorKeys.lists() });
    },
  });
};
