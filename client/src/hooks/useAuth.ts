import { useState } from 'react';
import api from '../lib/axios';
import { setAuthCookie, removeAuthCookie } from '../features/auth/actions';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, kata_sandi: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, kata_sandi });
      const { token, user } = response.data.data;
      
      // Set HTTP-only cookie via Server Action
      await setAuthCookie(token);
      
      return { success: true, user };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (nama: string, email: string, kata_sandi: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/register', { nama, email, kata_sandi });
      return { success: true };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registrasi gagal');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return { success: true, message: res.data.message };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengirim email reset');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (id: string, token: string, kata_sandi: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/auth/reset-password?id=${id}`, { token, kata_sandi });
      return { success: true, message: res.data.message };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal reset password');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await removeAuthCookie();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed', err);
      // Fallback for client side
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      window.location.href = '/login';
    }
  };

  return { login, register, forgotPassword, resetPassword, logout, loading, error };
};
