"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Progress } from '../../../components/ui/Progress';
import { useEnergyBreakdown } from '../hooks';
import { Skeleton, ErrorState, EmptyState } from '../../../components/ui/StateFeedback';

interface BuildingConsumptionProps {
  filters?: any;
}

export function BuildingConsumption({ filters }: BuildingConsumptionProps = {}) {
  const { data: response, isLoading, isError, refetch } = useEnergyBreakdown(filters);
  const rawBreakdown = response || [];

  const maxVal = rawBreakdown.length > 0
    ? Math.max(...rawBreakdown.map((b: any) => b.actual_kwh || 0), 0.001)
    : 1;

  return (
    <Card className="border-transparent shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-lg text-black font-heading font-bold">
          Consumption by Room
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-8 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : isError ? (
          <ErrorState message="Gagal memuat konsumsi energi per ruangan" onRetry={() => refetch()} />
        ) : rawBreakdown.length === 0 ? (
          <EmptyState
            message="Tidak ada data konsumsi ruangan"
            description="Belum ada data sensor energi per ruangan untuk hari ini."
          />
        ) : (
          rawBreakdown.map((row: any, idx: number) => {
            const hasSensor = row.has_sensor !== false;
            const valKwh = row.actual_kwh !== null && row.actual_kwh !== undefined
              ? Number(row.actual_kwh).toFixed(3)
              : null;
            const progress = valKwh !== null ? (Number(valKwh) / maxVal) * 100 : 0;

            return (
              <div key={row.room_id || idx} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-[#F1F5F9] text-primary-dark font-bold text-xs flex items-center justify-center">
                      {String.fromCharCode(65 + (idx % 26))}
                    </div>
                    <span className="text-sm font-bold text-black">{row.room_name}</span>
                    {row.is_simulated && (
                      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 border-amber-200">
                        Simulasi
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-bold text-black">
                    {hasSensor && valKwh !== null ? `${valKwh} kWh` : 'Belum ada sensor'}
                  </span>
                </div>
                {hasSensor && valKwh !== null ? (
                  <Progress
                    value={progress}
                    indicatorColor="bg-primary-dark"
                    className="h-2 bg-[#E2E8F0]"
                  />
                ) : (
                  <div className="h-2 w-full bg-slate-100 rounded-full" />
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
