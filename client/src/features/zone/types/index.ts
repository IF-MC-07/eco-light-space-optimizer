import { Zone as GlobalZone } from '@/types';

export interface Zone extends GlobalZone {
  description?: string;
}

export type ZonePayload = Omit<Zone, 'created_at' | 'updated_at'>;
