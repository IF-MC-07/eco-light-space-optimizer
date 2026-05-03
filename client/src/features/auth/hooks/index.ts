import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  userList: () => [...authKeys.all, 'users'] as const,
  userDetail: (id: string) => [...authKeys.all, 'users', id] as const,
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

// --- User Hooks ---
export const useUserList = () => {
  return useQuery({
    queryKey: authKeys.userList(),
    queryFn: api.getUsers,
  });
};

export const useUserDetail = (id: string) => {
  return useQuery({
    queryKey: authKeys.userDetail(id),
    queryFn: () => api.getUserById(id),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.userList() });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: authKeys.userList() });
      queryClient.invalidateQueries({ queryKey: authKeys.userDetail(variables.id) });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.userList() });
    },
  });
};
