"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { DoorOpen } from 'lucide-react';
import { useSavingsBreakdown } from '../hooks';
import { Skeleton, ErrorState, EmptyState } from '../../../components/ui/StateFeedback';

interface SavingsBreakdownTableProps {
  filters: {
    range_type: string;
    start_date: string;
    end_date: string;
  };
}

export function SavingsBreakdownTable({ filters }: SavingsBreakdownTableProps) {
  const { data: response, isLoading, isError, refetch } = useSavingsBreakdown(filters);
  const breakdown = response || [];

  return (
    <Card className="border-transparent shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-lg text-black font-heading font-bold">
          Rincian Energi per Ruangan
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <ErrorState message="Gagal memuat rincian energi ruangan" onRetry={() => refetch()} />
        ) : breakdown.length === 0 ? (
          <EmptyState
            message="Tidak ada data rincian energi"
            description="Belum ada data sensor daya per ruangan pada rentang waktu ini."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-secondary font-bold uppercase tracking-wider border-b border-neutral-border">
                <tr>
                  <th className="pb-3 px-3">Room</th>
                  <th className="pb-3 px-3">Total Energy</th>
                  <th className="pb-3 px-3">Baseline</th>
                  <th className="pb-3 px-3">Selisih terhadap baseline</th>
                  <th className="pb-3 px-3 text-right">Rasio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border/50">
                {breakdown.map((row, i) => {
                  if (!row.has_sensor) {
                    return (
                      <tr key={row.room_id || i} className="hover:bg-neutral/40 transition-colors">
                        <td className="py-4 px-3 font-medium text-secondary-dark flex items-center">
                          <DoorOpen className="w-4 h-4 mr-2.5 text-secondary-light" />
                          <span>{row.room_name}</span>
                          {row.is_simulated && (
                            <Badge variant="outline" className="ml-2 text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 border-amber-200">
                              Simulasi
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-3 text-secondary-light italic">Belum ada sensor</td>
                        <td className="py-4 px-3 text-secondary-light italic">Belum ada sensor</td>
                        <td className="py-4 px-3 text-secondary-light italic">Belum ada sensor</td>
                        <td className="py-4 px-3 text-right text-secondary-light italic">Belum ada sensor</td>
                      </tr>
                    );
                  }

                  const actualDisplay =
                    row.actual_kwh !== null && row.actual_kwh !== undefined
                      ? `${row.actual_kwh.toFixed(3)} kWh`
                      : '—';

                  const baselineDisplay =
                    row.baseline_kwh !== null && row.baseline_kwh !== undefined
                      ? `${row.baseline_kwh.toFixed(3)} kWh`
                      : '—';

                  const deltaDisplay =
                    row.delta_kwh !== null && row.delta_kwh !== undefined
                      ? `${row.delta_kwh > 0 ? '+' : ''}${row.delta_kwh.toFixed(3)} kWh`
                      : '—';

                  const ratioDisplay =
                    row.baseline_kwh !== null &&
                    row.baseline_kwh > 0 &&
                    row.delta_kwh !== null &&
                    row.delta_kwh !== undefined
                      ? `${((row.delta_kwh / row.baseline_kwh) * 100).toFixed(1)}%`
                      : '—';

                  const isSaving = (row.delta_kwh || 0) > 0;
                  const isWaste = (row.delta_kwh || 0) < 0;

                  return (
                    <tr key={row.room_id || i} className="hover:bg-neutral/40 transition-colors">
                      <td className="py-4 px-3 font-semibold text-black flex items-center">
                        <DoorOpen className="w-4 h-4 mr-2.5 text-primary-dark" />
                        <span>{row.room_name}</span>
                        {row.is_simulated && (
                          <Badge variant="outline" className="ml-2 text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 border-amber-200">
                            Simulasi
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-3 text-secondary-dark font-medium">{actualDisplay}</td>
                      <td className="py-4 px-3 text-secondary font-medium">{baselineDisplay}</td>
                      <td
                        className={`py-4 px-3 font-bold ${
                          isSaving
                            ? 'text-green-700'
                            : isWaste
                            ? 'text-red-700'
                            : 'text-secondary-dark'
                        }`}
                      >
                        {deltaDisplay}
                      </td>
                      <td className="py-4 px-3 text-right">
                        {ratioDisplay !== '—' ? (
                          <Badge
                            className={`font-bold border-transparent ${
                              isSaving
                                ? 'bg-green-100 text-green-800'
                                : isWaste
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ratioDisplay}
                          </Badge>
                        ) : (
                          <span className="text-secondary-light">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
