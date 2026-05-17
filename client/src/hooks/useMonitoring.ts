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

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/monitoring/stats');
      return { success: true, data: response.data.data };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch stats');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/monitoring/devices');
      return { success: true, data: response.data.data };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch devices');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDevice = useCallback(async (id: string | number, body: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/monitoring/devices/${id}`, body);
      return { success: true, data: response.data.data };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update device');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const postMasterControl = useCallback(async (action: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/monitoring/master-control', { action });
      return { success: true, data: response.data.data };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post master control');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClimate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/monitoring/climate');
      return { success: true, data: response.data.data };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch climate');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateClimate = useCallback(async (target_temperature: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put('/monitoring/climate', { target_temperature });
      return { success: true, data: response.data.data };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update climate');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { 
    fetchEnergy, 
    fetchSensor, 
    fetchStats, 
    fetchDevices, 
    updateDevice, 
    postMasterControl, 
    fetchClimate, 
    updateClimate, 
    loading, 
    error 
  };
};
