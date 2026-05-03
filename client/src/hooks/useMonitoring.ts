import { useState, useCallback } from 'react';
import api from '../lib/axios';

export const useMonitoring = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEnergy = useCallback(async (roomId?: number | string, date?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (roomId) params.append('room_id', String(roomId));
      if (date) params.append('date', date);
      
      const response = await api.get(`/monitoring/energy?${params.toString()}`);
      return { success: true, data: response.data.data };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch energy data');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSensor = useCallback(async (roomId?: number | string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (roomId) params.append('room_id', String(roomId));
      
      const response = await api.get(`/monitoring/sensor?${params.toString()}`);
      return { success: true, data: response.data.data };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch sensor data');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchEnergy, fetchSensor, loading, error };
};
