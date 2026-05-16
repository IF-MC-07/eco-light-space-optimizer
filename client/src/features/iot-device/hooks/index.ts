import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { iotDeviceApi } from '../api';
import { IotDevice } from '../types';

export const useDevices = (roomId?: string) => {
  return useQuery({
    queryKey: ['iot-devices', 'list', roomId],
    queryFn: () => iotDeviceApi.getAll(roomId),
  });
};

export const useDevice = (id: string) => {
  return useQuery({
    queryKey: ['iot-devices', 'detail', id],
    queryFn: () => iotDeviceApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<IotDevice>) => iotDeviceApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iot-devices'] });
    },
  });
};

export const useUpdateDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<IotDevice> }) => 
      iotDeviceApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iot-devices'] });
    },
  });
};

export const useRemoveDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => iotDeviceApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iot-devices'] });
    },
  });
};
