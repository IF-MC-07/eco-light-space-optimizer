import { serverAPI } from '@/lib/api';

// --- Types ---
export interface LogEnergi {
  id_log_energi: string;
  id_sensor: string;
  konsumsi_wh: number;
  waktu_log: string;
}

export interface LogDeteksi {
  id_log_deteksi: string;
  id_kamera: string;
  jumlah_orang: number;
  waktu_deteksi: string;
  gambar_bukti?: string;
}

export interface KontrolLampu {
  id_kontrol_lampu: string;
  id_perangkat: string;
  status: string; // 'ON' | 'OFF'
  tingkat_kecerahan?: number;
  waktu_kontrol: string;
  dikontrol_oleh?: string;
}

export interface KontrolAC {
  id_kontrol_ac: string;
  id_perangkat: string;
  status: string; // 'ON' | 'OFF'
  suhu?: number;
  waktu_kontrol: string;
  dikontrol_oleh?: string;
}

// --- Log Energi Endpoints ---
export const getLogEnergi = async (params?: any): Promise<LogEnergi[]> => {
  const response = await serverAPI.get('/log-energi', { params });
  return response.data.data || response.data;
};

export const getLogEnergiById = async (id: string): Promise<LogEnergi> => {
  const response = await serverAPI.get(`/log-energi/${id}`);
  return response.data.data || response.data;
};

export const createLogEnergi = async (data: any): Promise<LogEnergi> => {
  const response = await serverAPI.post('/log-energi', data);
  return response.data.data || response.data;
};

// --- Log Deteksi Endpoints ---
export const getLogDeteksi = async (params?: any): Promise<LogDeteksi[]> => {
  const response = await serverAPI.get('/log-deteksi', { params });
  return response.data.data || response.data;
};

export const getLogDeteksiById = async (id: string): Promise<LogDeteksi> => {
  const response = await serverAPI.get(`/log-deteksi/${id}`);
  return response.data.data || response.data;
};

export const createLogDeteksi = async (data: any): Promise<LogDeteksi> => {
  const response = await serverAPI.post('/log-deteksi', data);
  return response.data.data || response.data;
};

// --- Kontrol Lampu Endpoints ---
export const getKontrolLampu = async (params?: any): Promise<KontrolLampu[]> => {
  const response = await serverAPI.get('/kontrol-lampu', { params });
  return response.data.data || response.data;
};

export const createKontrolLampu = async (data: any): Promise<KontrolLampu> => {
  const response = await serverAPI.post('/kontrol-lampu', data);
  return response.data.data || response.data;
};

// --- Kontrol AC Endpoints ---
export const getKontrolAC = async (params?: any): Promise<KontrolAC[]> => {
  const response = await serverAPI.get('/kontrol-ac', { params });
  return response.data.data || response.data;
};

export const createKontrolAC = async (data: any): Promise<KontrolAC> => {
  const response = await serverAPI.post('/kontrol-ac', data);
  return response.data.data || response.data;
};
