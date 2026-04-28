import api from '@/lib/axios';
import { Zona, ZonaPayload } from '../types';

export const getZonaByKamera = async (idKamera: number): Promise<Zona[]> => {
  const response = await api.get(`/zona/kamera/${idKamera}`);
  return response.data.data;
};

export const simpanZona = async (zonaList: ZonaPayload[]): Promise<void> => {
  await api.post('/zona/simpan', zonaList);
};

export const deleteZona = async (idZona: number): Promise<void> => {
  await api.delete(`/zona/${idZona}`);
};
