import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';

export const useDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard/summary');
      setData(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { data, loading, error, refetch: fetchSummary };
};
