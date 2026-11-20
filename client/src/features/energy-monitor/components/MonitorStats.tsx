"use client";
import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Clock } from 'lucide-react';
import { useEnergySummary, usePowerSensors } from '../hooks';
import { Skeleton } from '../../../components/ui/StateFeedback';

function formatRelativeTime(dateString?: string) {
  if (!dateString) return "Tidak ada data";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs) || diffMs < 0) return "Baru saja";
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} mnt lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

export function MonitorStats() {
  const { data: response, isLoading: isSummaryLoading } = useEnergySummary();
  const { data: sensorResponse, isLoading: isSensorsLoading } = usePowerSensors();
  const summary = response;
  const sensors = sensorResponse || [];

  if (isSummaryLoading || isSensorsLoading) {
    return (
      <div className="grid grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-transparent shadow-sm">
            <CardContent className="p-5 mt-5">
              <Skeleton className="h-3 w-28 mb-3" />
              <Skeleton className="h-8 w-36 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const hasData = sensors.length > 0;

  const todayUsageWatts = summary ? (summary.today_usage || 0) : 0;
  const todayUsageDisplay = todayUsageWatts >= 1000
    ? `${(todayUsageWatts / 1000).toFixed(2)} kWh`
    : `${todayUsageWatts.toFixed(1)} Wh`;

  const watts = sensors.map((s: any) => parseFloat(s.power_watts) || 0).filter((w: number) => w > 0);
  const meanWatts = watts.length > 0 ? watts.reduce((a: number, b: number) => a + b, 0) / watts.length : 0;

  const timestamps = sensors
    .map((s: any) => s.read_at ? new Date(s.read_at).getTime() : 0)
    .filter((t: number) => !isNaN(t) && t > 0);
  const latestTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : null;
  const latestRelative = latestTimestamp ? formatRelativeTime(new Date(latestTimestamp).toISOString()) : "Tidak ada data";

  return (
    <div className="grid grid-cols-4 gap-6 mb-6">
      <Card className="border-transparent shadow-sm">
        <CardContent className="p-5 mt-5">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Today's Consumption</p>
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-2xl font-heading font-bold text-black">
              {hasData ? todayUsageDisplay : "Tidak ada data"}
            </h3>
          </div>
          <p className="text-xs text-secondary-light font-medium">
            {hasData ? "Total energi hari ini" : "Menunggu pembacaan sensor"}
          </p>
        </CardContent>
      </Card>

      <Card className="border-transparent shadow-sm">
        <CardContent className="p-5 mt-5">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Avg Power Draw</p>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-primary-dark" />
            <h3 className="text-xl font-heading font-bold text-black">
              {hasData ? `${meanWatts.toFixed(1)} W` : "Tidak ada data"}
            </h3>
          </div>
          <p className="text-xs text-secondary-light font-medium">
            {hasData ? `Rata-rata dari ${sensors.length} pembacaan` : "Menunggu pembacaan sensor"}
          </p>
        </CardContent>
      </Card>

      <Card className="border-transparent shadow-sm">
        <CardContent className="p-5 mt-5">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Energy Saved Today</p>
          <div className="mb-1">
            <h3 className="text-2xl font-heading font-bold text-black">
              {hasData ? "Belum tersedia" : "Tidak ada data"}
            </h3>
          </div>
          <p className="text-xs text-secondary-light font-medium">
            {hasData ? "Perhitungan baseline di Tahap 2" : "Menunggu pembacaan sensor"}
          </p>
        </CardContent>
      </Card>

      <Card className="border-transparent shadow-sm">
        <CardContent className="p-5 mt-5">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Pembacaan terakhir</p>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-2xl font-heading font-bold text-black">
              {hasData ? latestRelative : "Tidak ada data"}
            </h3>
          </div>
          <p className="text-xs text-secondary-light font-medium">
            {latestTimestamp ? new Date(latestTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Belum ada telemetri"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
