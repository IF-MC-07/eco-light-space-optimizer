import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export const automationScheduleKeys = {
  all: ['automation-schedules'] as const,
  lists: () => [...automationScheduleKeys.all, 'list'] as const,
  list: (params?: any) => [...automationScheduleKeys.lists(), params] as const,
  details: () => [...automationScheduleKeys.all, 'detail'] as const,
  detail: (id: string) => [...automationScheduleKeys.details(), id] as const,
};

// --- Automation Schedule Hooks ---
export const useAutomationScheduleList = (params?: any) => {
  return useQuery({
    queryKey: automationScheduleKeys.list(params),
    queryFn: () => api.getAutomationSchedules(params),
  });
};

export const useAutomationScheduleDetail = (id: string) => {
  return useQuery({
    queryKey: automationScheduleKeys.detail(id),
    queryFn: () => api.getAutomationScheduleById(id),
    enabled: !!id,
  });
};

export const useCreateAutomationSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAutomationSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationScheduleKeys.lists() });
    },
  });
};

export const useUpdateAutomationSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateAutomationSchedule(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: automationScheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: automationScheduleKeys.detail(variables.id) });
    },
  });
};

export const useDeleteAutomationSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteAutomationSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationScheduleKeys.lists() });
    },
  });
};
