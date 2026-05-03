import api from '@/lib/axios';
import { Zona, ZonaPayload } from '../types';

export const getZonaByKamera = async (idKamera: number): Promise<Zona[]> => {
  const response = await api.get(`/zone/camera/${idKamera}`);
  return response.data.data;
};

export const simpanZona = async (zonaList: ZonaPayload[]): Promise<void> => {
  await api.post('/zone/simpan', zonaList);
};

export const deleteZona = async (idZona: number): Promise<void> => {
  await api.delete(`/zone/${idZona}`);
};
