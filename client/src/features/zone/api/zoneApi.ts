import api from '@/lib/axios';
import type { Zone } from '@/types';

export const getZoneByCamera = async (cameraId: string): Promise<Zone[]> => {
  const response = await api.get(`/zones/camera/${cameraId}`);
  return response.data.data;
};

export const saveZone = async (zoneList: Partial<Zone>[]): Promise<void> => {
  await api.post('/zones/simpan', zoneList);
};

export const deleteZone = async (zoneId: string): Promise<void> => {
  await api.delete(`/zones/${zoneId}`);
};
