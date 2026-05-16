import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '../api';
import { Room } from '../types';

// Room hooks
export const useRooms = () => {
  return useQuery({
    queryKey: ['rooms', 'list'],
    queryFn: () => roomsApi.getAll(),
  });
};

export const useRoom = (id: string) => {
  return useQuery({
    queryKey: ['rooms', 'detail', id],
    queryFn: () => roomsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Room, 'room_id'>) => roomsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Room> }) => roomsApi.update(id, payload),
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
