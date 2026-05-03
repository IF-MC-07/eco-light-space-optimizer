import api from '@/lib/axios';
import { Zone } from '@/types';

export const getZoneByCamera = async (cameraId: number): Promise<Zone[]> => {
  const response = await api.get(`/zone/camera/${cameraId}`);
  return response.data.data;
};

export const saveZone = async (zoneList: Partial<Zone>[]): Promise<void> => {
  await api.post('/zone/save', zoneList);
};

export const deleteZone = async (zoneId: number): Promise<void> => {
  await api.delete(`/zone/${zoneId}`);
};
