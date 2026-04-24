import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';

export const useRuangan = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRuangan = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/ruangan');
      setData(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data ruangan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuangan();
  }, [fetchRuangan]);

  const createRuangan = async (payload: any) => {
    try {
      await api.post('/ruangan', payload);
      await fetchRuangan();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message };
    }
  };

  const updateRuangan = async (id: number | string, payload: any) => {
    try {
      await api.put(`/ruangan/${id}`, payload);
      await fetchRuangan();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message };
    }
  };

  const deleteRuangan = async (id: number | string) => {
    try {
      await api.delete(`/ruangan/${id}`);
      await fetchRuangan();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message };
    }
  };

  return { data, loading, error, createRuangan, updateRuangan, deleteRuangan, refetch: fetchRuangan };
};
