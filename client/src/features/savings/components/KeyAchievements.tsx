"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { useSavingsYoY } from '../hooks';
import { Skeleton, ErrorState } from '../../../components/ui/StateFeedback';

interface KeyAchievementsProps {
  filters: {
    range_type: string;
    start_date: string;
    end_date: string;
  };
}

export function KeyAchievements({ filters }: KeyAchievementsProps) {
  const { data: yoy, isLoading, isError, refetch } = useSavingsYoY(filters);

  if (isLoading) {
    return (
      <Card className="border-transparent shadow-sm">
        <CardHeader className="pb-4 pt-6 px-6">
          <CardTitle className="text-lg text-black font-heading font-bold">Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-transparent shadow-sm">
        <CardHeader className="pb-4 pt-6 px-6">
          <CardTitle className="text-lg text-black font-heading font-bold">Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <ErrorState message="Gagal memuat wawasan penghematan" onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  const changePct = yoy?.change_percentage ?? 0;
  const status = yoy?.status || 'insufficient_baseline';

  return (
    <Card className="border-transparent shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-lg text-black font-heading font-bold">Key Insights</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <ul className="space-y-5">
          <li className="flex items-start">
            <span className={`mt-1.5 mr-3 w-2 h-2 rounded-full ${status === 'saving' ? 'bg-green-500' : status === 'waste' ? 'bg-red-500' : status === 'insufficient_baseline' ? 'bg-amber-500' : 'bg-primary'} flex-shrink-0`}></span>
            <div className="text-xs text-secondary-dark leading-relaxed">
              {status === 'saving' ? (
                <>
                  <p><span className="font-bold text-green-700">Energy Saving (-{changePct}%):</span> Konsumsi energi menurun dibandingkan periode sebelumnya berkat penerapan jadwal otomatisasi.</p>
                  <p className="mt-1 text-[11px] text-green-800 font-semibold">Action: Pertahankan aturan otomasi saat ini dan terapkan ke ruangan lain.</p>
                </>
              ) : status === 'waste' ? (
                <>
                  <p><span className="font-bold text-red-700">Energy Waste (+{Math.abs(changePct)}%):</span> Konsumsi energi meningkat akibat penggunaan pendingin ruangan atau pencahayaan berlebih.</p>
                  <p className="mt-1 text-[11px] text-red-800 font-semibold">Action: Terapkan jadwal otomasi (08:00 - 17:00) & atur suhu AC ke 24°C.</p>
                </>
              ) : status === 'insufficient_baseline' ? (
                <>
                  <p><span className="font-bold text-amber-700">Data Belum Cukup:</span> Data belum cukup untuk membandingkan periode.</p>
                  <p className="mt-1 text-[11px] text-secondary font-semibold">Action: Kumpulkan data telemetri tambahan pada periode saat ini dan sebelumnya untuk perbandingan akurat.</p>
                </>
              ) : (
                <>
                  <p><span className="font-bold text-black">Stable Consumption:</span> Konsumsi energi berada dalam rentang normal dan stabil dibandingkan periode sebelumnya.</p>
                  <p className="mt-1 text-[11px] text-secondary font-semibold">Action: Pertimbangkan batas peredupan cahaya sekitar untuk efisiensi tambahan.</p>
                </>
              )}
            </div>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
