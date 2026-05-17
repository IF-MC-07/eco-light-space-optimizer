import { useState, useEffect, useCallback } from 'react';
import type { Zone } from '@/types';
import { getZoneByCamera, saveZone as apiSaveZone, deleteZone as apiDeleteZone } from '../api/zoneApi';
import { MOCK_ZONES } from '@/mocks/zoneData';

export const useZone = (cameraId: string) => {
  const [zonas, setZonas] = useState<Zone[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const fetchZonas = useCallback(async () => {
    if (!cameraId) return;
    try {
      // Try to get from mock data first
      const mockData = MOCK_ZONES.filter(z => z.camera_id === cameraId);
      if (mockData.length > 0) {
        setZonas(mockData);
        return;
      }

      // If not in mock, try API
      const data = await getZoneByCamera(cameraId);
      setZonas(data);
    } catch (error) {
      console.error('Failed to fetch zones', error);
      // Final fallback to empty if everything fails
      setZonas([]);
    }
  }, [cameraId]);

  useEffect(() => {
    fetchZonas();
  }, [fetchZonas]);

  const addZona = (zona: Omit<Zone, 'zone_id' | 'camera_id'>) => {
    const newZona: Zone = {
      ...zona,
      camera_id: cameraId,
      // Create a temporary string ID for new zones before they are saved to DB
      zone_id: `TEMP-${Date.now()}`
    };
    setZonas(prev => [...prev, newZona]);
    setSelectedId(newZona.zone_id!);
  };

  const updateZona = (id: string, changes: Partial<Zone>) => {
    setZonas(prev => prev.map(z => z.zone_id === id ? { ...z, ...changes } : z));
  };

  const deleteZone = async (id: string) => {
    // If it's a temporary zone (TEMP- prefix), just remove from state
    if (id.startsWith('TEMP-')) {
      setZonas(prev => prev.filter(z => z.zone_id !== id));
      if (selectedId === id) setSelectedId(null);
      return;
    }

    try {
      await apiDeleteZone(id);
      setZonas(prev => prev.filter(z => z.zone_id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (error) {
      console.error('Failed to delete zone', error);
    }
  };

  const selectZona = (id: string | null) => {
    setSelectedId(id);
  };
  const clearAll = async () => {
    try {
      // Pisahkan zona yang sudah ada di DB (bukan TEMP-) vs zona temporary
      const savedZonas = zonas.filter(z => z.zone_id && !z.zone_id.startsWith('TEMP-'));

      // Hapus semua zona yang ada di DB secara paralel
      await Promise.all(savedZonas.map(z => apiDeleteZone(z.zone_id!)));

      // Baru kosongkan state lokal
      setZonas([]);
      setSelectedId(null);
    } catch (error) {
      console.error('Failed to clear all zones', error);
    }
  };

  const saveAll = async () => {
    setIsSaving(true);
    try {
      const payload: Partial<Zone>[] = zonas.map(z => {
        // Strip out the temporary zone_id for new entries
        const { zone_id, ...rest } = z;
        return (zone_id && !zone_id.startsWith('TEMP-')) ? { zone_id, ...rest } : rest;
      });

      await apiSaveZone(payload);
      setLastSaved(new Date());
      // Re-fetch to get real DB IDs for newly added zones
      await fetchZonas();
    } catch (error) {
      console.error('Failed to save zones', error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    zonas,
    selectedId,
    isSaving,
    lastSaved,
    addZona,
    updateZona,
    deleteZone,
    selectZona,
    clearAll,
    saveAll
  };
};
