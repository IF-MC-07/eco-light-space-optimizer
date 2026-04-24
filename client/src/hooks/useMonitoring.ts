import { useState, useCallback } from 'react';
import api from '../lib/axios';

export const useMonitoring = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEnergi = useCallback(async (id_ruangan?: number | string, tanggal?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (id_ruangan) params.append('id_ruangan', String(id_ruangan));
      if (tanggal) params.append('tanggal', tanggal);
      
      const response = await api.get(`/monitoring/energi?${params.toString()}`);
      return { success: true, data: response.data.data };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data energi');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSensor = useCallback(async (id_ruangan?: number | string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (id_ruangan) params.append('id_ruangan', String(id_ruangan));
      
      const response = await api.get(`/monitoring/sensor?${params.toString()}`);
      return { success: true, data: response.data.data };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data sensor');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchEnergi, fetchSensor, loading, error };
};
