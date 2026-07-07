import { useState } from 'react';
import api from '../lib/axios';
import { setAuthCookie, removeAuthCookie } from '../features/auth/actions';
import { toast } from 'sonner';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

const login = async (email: string, password: string) => {
  setLoading(true);
  setError(null);
  try {
    const response = await api.post('/auth/login', { email, password }, {
      withCredentials: true   // ← Tambahkan ini
    });
    
    const { token, user } = response.data.data;
    await setAuthCookie(token);
    
    return { success: true, user };
  } catch (err: any) {
    setError(err.response?.data?.message || 'Login gagal');
    return { success: false, message: err.response?.data?.message };
  } finally {
    setLoading(false);
  }
};
  const register = async (name: string, username: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/register', { name, username, email, password });
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

  const resetPassword = async (id: string, token: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/auth/reset-password?id=${id}`, { token, password });
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
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        toast.error('Sesi habis. Silakan login kembali.');
      } else {
        toast.error('Gagal memuat data. Silakan coba lagi.');
      }
      // Fallback for client side
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      window.location.href = '/login';
    }
  };

  return { login, register, forgotPassword, resetPassword, logout, loading, error };
};
