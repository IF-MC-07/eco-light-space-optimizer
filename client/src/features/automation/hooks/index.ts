import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationApi } from '../api';
import type { AutomationSchedule } from '../types';

export const useSchedules = () => {
  return useQuery({
    queryKey: ['automation-schedules', 'list'],
    queryFn: () => automationApi.getAll(),
  });
};

export const useSchedule = (id: string) => {
  return useQuery({
    queryKey: ['automation-schedules', 'detail', id],
    queryFn: () => automationApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AutomationSchedule>) => automationApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-schedules'] });
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AutomationSchedule> }) => 
      automationApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-schedules'] });
    },
  });
};

export const useRemoveSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-schedules'] });
    },
  });
};

export const useRemoveAllSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => automationApi.removeAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-schedules'] });
    },
  });
};

export const useAutomationStats = () => {
  return useQuery({
    queryKey: ['automation-schedules', 'stats'],
    queryFn: () => automationApi.getStats(),
  });
};
