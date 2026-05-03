import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export const iotDeviceKeys = {
  all: ['iot-device'] as const,
  lists: () => [...iotDeviceKeys.all, 'list'] as const,
  list: (params?: any) => [...iotDeviceKeys.lists(), params] as const,
  details: () => [...iotDeviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...iotDeviceKeys.details(), id] as const,
};

// --- IoT Device Hooks ---
export const useIoTDeviceList = (params?: any) => {
  return useQuery({
    queryKey: iotDeviceKeys.list(params),
    queryFn: () => api.getIoTDevices(params),
  });
};

export const useIoTDeviceDetail = (id: string) => {
  return useQuery({
    queryKey: iotDeviceKeys.detail(id),
    queryFn: () => api.getIoTDeviceById(id),
    enabled: !!id,
  });
};

export const useCreateIoTDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createIoTDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: iotDeviceKeys.lists() });
    },
  });
};

export const useUpdateIoTDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateIoTDevice(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: iotDeviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: iotDeviceKeys.detail(variables.id) });
    },
  });
};

export const useDeleteIoTDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteIoTDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: iotDeviceKeys.lists() });
    },
  });
};
