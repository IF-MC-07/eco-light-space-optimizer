import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';
import type { Room } from '@/types';

export const useRoom = () => {
  const [data, setData] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/rooms');
      setData(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const createRoom = async (payload: any) => {
    try {
      await api.post('/rooms', payload);
      await fetchRooms();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message };
    }
  };

  const updateRoom = async (id: number | string, payload: any) => {
    try {
      await api.put(`/rooms/${id}`, payload);
      await fetchRooms();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message };
    }
  };

  const deleteRoom = async (id: number | string) => {
    try {
      await api.delete(`/rooms/${id}`);
      await fetchRooms();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message };
    }
  };

  return { data, loading, error, createRoom, updateRoom, deleteRoom, refetch: fetchRooms };
};
