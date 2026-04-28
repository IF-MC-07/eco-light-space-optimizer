export interface Zona {
  id_zona?: number;
  id_kamera: number;
  nama_zona: string;
  x1_pct: number;
  y1_pct: number;
  x2_pct: number;
  y2_pct: number;
  warna: string;
  status_zona?: 'aktif' | 'nonaktif';
  urutan?: number;
}

export type ZonaPayload = Omit<Zona, 'status_zona'>;
