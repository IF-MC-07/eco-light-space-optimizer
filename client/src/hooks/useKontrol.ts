import { useState, useCallback } from 'react';
import api from '../lib/axios';

export const useKontrol = () => {
  const [loading, setLoading] = useState(false);

  const toggleLampu = async (id: number | string) => {
    setLoading(true);
    try {
      const res = await api.patch(`/kontrol-lampu/${id}/toggle`);
      return { success: true, data: res.data.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const toggleAc = async (id: number | string, suhu_setting?: number) => {
    setLoading(true);
    try {
      const res = await api.patch(`/kontrol-ac/${id}/toggle`, { suhu_setting });
      return { success: true, data: res.data.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  return { toggleLampu, toggleAc, loading };
};
