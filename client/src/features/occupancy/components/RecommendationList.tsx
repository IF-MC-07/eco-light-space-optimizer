import React from 'react';
import type { RoomRecommendation } from '../types';
import { statusMeta, formatPercent, formatSeats } from '../utils';
import { Badge } from '@/components/ui/Badge';

interface RecommendationListProps {
  recommendations: RoomRecommendation[];
}

export function RecommendationList({ recommendations }: RecommendationListProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="mt-3 p-3 bg-neutral rounded-lg border border-neutral-border text-xs text-secondary text-center">
        Tidak ada ruangan lain yang tersedia saat ini.
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-neutral-border space-y-2">
      <div className="text-[11px] font-bold text-secondary-dark uppercase tracking-wider">
        Rekomendasi ruangan lain
      </div>
      <div className="space-y-2">
        {recommendations.map((rec) => {
          const meta = statusMeta[rec.status as keyof typeof statusMeta];
          const locationText = rec.building
            ? `${rec.building} · Lantai ${rec.floor ?? '-'}`
            : 'Gedung belum diatur';

          return (
            <div
              key={rec.room_id}
              className="p-2.5 bg-white rounded-lg border border-neutral-border shadow-xs flex flex-col gap-1 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-semibold text-secondary-dark truncate">
                  <span className="truncate">{rec.room_name || rec.room_id}</span>
                  {rec.is_simulated && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-400 text-amber-700 bg-amber-50">
                      Simulasi
                    </Badge>
                  )}
                </div>
                {meta && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.badgeClass}`}>
                    {rec.status}
                  </span>
                )}
              </div>

              <div className="text-[11px] text-secondary flex items-center justify-between">
                <span>{locationText}</span>
                <span className="font-medium text-secondary-dark">
                  {formatSeats(rec.available_seats)} · {formatPercent(rec.occupancy_pct)}
                </span>
              </div>

              {rec.reason && (
                <div className="text-[10px] text-secondary-light italic">
                  {rec.reason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

