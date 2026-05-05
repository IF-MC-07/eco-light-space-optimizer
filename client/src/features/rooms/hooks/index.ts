import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi, devicesApi, schedulesApi } from '../api';
import { 
  RoomFilters, CreateRoomPayload, UpdateRoomPayload,
  CreateDevicePayload, UpdateDevicePayload,
  CreateSchedulePayload, UpdateSchedulePayload 
} from '../types';

// Room hooks
export const useRooms = (filters?: RoomFilters) => {
  return useQuery({
    queryKey: ['rooms', 'list', filters],
    queryFn: () => roomsApi.getAll(filters),
  });
};

export const useRoom = (id: string) => {
  return useQuery({
    queryKey: ['rooms', 'detail', id],
    queryFn: () => roomsApi.getById(id),
    enabled: !!id,
  });
};

export const useRoomStats = () => {
  return useQuery({
    queryKey: ['rooms', 'stats'],
    queryFn: () => roomsApi.getStats(),
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoomPayload) => roomsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRoomPayload }) => roomsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useRemoveRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

// Device hooks
export const useDevices = (roomId: string) => {
  return useQuery({
    queryKey: ['devices', roomId],
    queryFn: () => devicesApi.getByRoom(roomId),
    enabled: !!roomId,
  });
};

export const useCreateDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDevicePayload) => devicesApi.create(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devices', variables.roomId] });
    },
  });
};

export const useUpdateDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // We don't have roomId in payload always, so invalidate all devices to be safe, or if available
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDevicePayload }) => devicesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
};

export const useRemoveDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => devicesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
};

export const useProvisionDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => devicesApi.provision(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
};

// Schedule hooks
export const useSchedules = (deviceId: string) => {
  return useQuery({
    queryKey: ['schedules', deviceId],
    queryFn: () => schedulesApi.getByDevice(deviceId),
    enabled: !!deviceId,
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSchedulePayload) => schedulesApi.create(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedules', variables.deviceId] });
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSchedulePayload }) => schedulesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

export const useRemoveSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => schedulesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

export const useToggleSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => schedulesApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};
