import { useState, useEffect, useCallback } from 'react';
import { Zona, ZonaPayload } from '../types';
import { getZonaByKamera, simpanZona as apiSimpanZona, deleteZona as apiDeleteZona } from '../api/zonaApi';

export const useZona = (idKamera: number) => {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const fetchZonas = useCallback(async () => {
    if (!idKamera) return;
    try {
      const data = await getZonaByKamera(idKamera);
      setZonas(data);
    } catch (error) {
      console.error('Failed to fetch zones', error);
    }
  }, [idKamera]);

  useEffect(() => {
    fetchZonas();
  }, [fetchZonas]);

  const addZona = (zona: Omit<Zona, 'id_zona' | 'id_kamera'>) => {
    const newZona: Zona = {
      ...zona,
      id_kamera: idKamera,
      // Create a temporary negative ID for new zones before they are saved to DB
      id_zona: -Date.now() 
    };
    setZonas(prev => [...prev, newZona]);
    setSelectedId(newZona.id_zona!);
  };

  const updateZona = (id: number, changes: Partial<Zona>) => {
    setZonas(prev => prev.map(z => z.id_zona === id ? { ...z, ...changes } : z));
  };

  const deleteZona = async (id: number) => {
    // If it's a temporary zone (negative ID), just remove from state
    if (id < 0) {
      setZonas(prev => prev.filter(z => z.id_zona !== id));
      if (selectedId === id) setSelectedId(null);
      return;
    }

    try {
      await apiDeleteZona(id);
      setZonas(prev => prev.filter(z => z.id_zona !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (error) {
      console.error('Failed to delete zone', error);
    }
  };

  const selectZona = (id: number) => {
    setSelectedId(id);
  };

  const clearAll = () => {
    // In a real scenario, you might want to call delete on all existing ones
    // But based on instruction, clearAll empties the list locally.
    setZonas([]);
    setSelectedId(null);
  };

  const saveAll = async () => {
    setIsSaving(true);
    try {
      const payload: ZonaPayload[] = zonas.map(z => {
        // Strip out the temporary negative id_zona for new entries
        const { id_zona, status_zona, ...rest } = z;
        return (id_zona && id_zona > 0) ? { id_zona, ...rest } : rest;
      }) as ZonaPayload[];
      
      await apiSimpanZona(payload);
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
    deleteZona,
    selectZona,
    clearAll,
    saveAll
  };
};
