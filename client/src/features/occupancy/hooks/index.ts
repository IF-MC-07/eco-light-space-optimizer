import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { occupancyApi } from '../api';
import type { OccupancyListParams } from '../types';

export const occupancyQueryKeys = {
  all: ['occupancy'] as const,
  list: (params?: OccupancyListParams) => ['occupancy', 'list', params] as const,
  detail: (id: string) => ['occupancy', 'detail', id] as const,
};

export const useOccupancy = (params?: OccupancyListParams) => {
  return useQuery({
    queryKey: occupancyQueryKeys.list(params),
    queryFn: () => occupancyApi.getAll(params),
    refetchInterval: 15000,
    staleTime: 5000,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
    retry: 1,
  });
};

export const useRoomOccupancy = (id: string) => {
  return useQuery({
    queryKey: occupancyQueryKeys.detail(id),
    queryFn: () => occupancyApi.getById(id),
    enabled: !!id,
    refetchInterval: 15000,
    staleTime: 5000,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
    retry: 1,
  });
};

