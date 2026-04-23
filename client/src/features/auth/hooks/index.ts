import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  penggunaList: () => [...authKeys.all, 'pengguna'] as const,
  penggunaDetail: (id: string) => [...authKeys.all, 'pengguna', id] as const,
};

// --- Auth Hooks ---
export const useLogin = () => {
  return useMutation({
    mutationFn: api.login,
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: api.register,
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: api.forgotPassword,
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: api.resetPassword,
  });
};

export const useMe = () => {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: api.me,
    retry: false, // Dont retry if unauthorized
  });
};

// --- Pengguna Hooks ---
export const usePenggunaList = () => {
  return useQuery({
    queryKey: authKeys.penggunaList(),
    queryFn: api.getPengguna,
  });
};

export const usePenggunaDetail = (id: string) => {
  return useQuery({
    queryKey: authKeys.penggunaDetail(id),
    queryFn: () => api.getPenggunaById(id),
    enabled: !!id,
  });
};

export const useCreatePengguna = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPengguna,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.penggunaList() });
    },
  });
};

export const useUpdatePengguna = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updatePengguna(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: authKeys.penggunaList() });
      queryClient.invalidateQueries({ queryKey: authKeys.penggunaDetail(variables.id) });
    },
  });
};

export const useDeletePengguna = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deletePengguna,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.penggunaList() });
    },
  });
};
