"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { usePowerSensors } from '../hooks';
import { POWER_ALERT_THRESHOLD_W, STALE_MINUTES } from '../constants';
import { Skeleton, ErrorState, EmptyState } from '../../../components/ui/StateFeedback';
import { ShieldCheck } from 'lucide-react';

interface AlertItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  isHigh: boolean;
}

export function UsageAlerts() {
  const { data: response, isLoading, isError, refetch } = usePowerSensors();
  const sensors = response || [];

  // 1. Cari pembacaan terbaru per ruangan
  const latestByRoom: Record<string, any> = {};
  let mostRecentTimestamp: number | null = null;

  sensors.forEach((s: any) => {
    if (!s.room_id || !s.read_at) return;
    const timeMs = new Date(s.read_at).getTime();
    if (isNaN(timeMs)) return;

    if (!mostRecentTimestamp || timeMs > mostRecentTimestamp) {
      mostRecentTimestamp = timeMs;
    }

    if (!latestByRoom[s.room_id] || timeMs > new Date(latestByRoom[s.room_id].read_at).getTime()) {
      latestByRoom[s.room_id] = s;
    }
  });

  const alerts: AlertItem[] = [];

  // Aturan 1: Daya terbaru melebihi ambang
  Object.values(latestByRoom).forEach((s: any) => {
    const power = parseFloat(s.power_watts) || 0;
    if (power > POWER_ALERT_THRESHOLD_W) {
      const roomName = s.Room?.room_name || s.room_id;
      const readDate = new Date(s.read_at);
      const timeStr = !isNaN(readDate.getTime())
        ? readDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : 'Unknown time';

      alerts.push({
        id: `power-${s.room_id}`,
        title: 'Power Spike Detected',
        desc: `Power ${power.toFixed(1)} W exceeds threshold ${POWER_ALERT_THRESHOLD_W} W (${roomName}, ${timeStr})`,
        time: timeStr,
        isHigh: true,
      });
    }
  });

  // Aturan 2: Tidak ada pembacaan baru melebihi batas waktu stale
  if (mostRecentTimestamp) {
    const diffMinutes = Math.floor((Date.now() - mostRecentTimestamp) / (60 * 1000));
    if (diffMinutes > STALE_MINUTES) {
      alerts.push({
        id: 'stale-telemetry',
        title: 'Delayed Telemetry',
        desc: `No new readings for ${diffMinutes} minutes`,
        time: `${diffMinutes}m ago`,
        isHigh: false,
      });
    }
  }

  return (
    <Card className="border-transparent shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 flex flex-row items-center justify-between">
        <CardTitle className="text-[11px] font-bold text-black uppercase tracking-widest">
          Usage Alerts
        </CardTitle>
        {alerts.length > 0 && (
          <span className="px-2 py-0.5 bg-[#FCE7F3] text-tertiary text-[10px] font-bold rounded-md tracking-wider">
            {alerts.length} ALERT
          </span>
        )}
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {isLoading ? (
          <div className="space-y-4 py-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load usage alerts" onRetry={() => refetch()} />
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="w-6 h-6 text-emerald-500" />}
            message="No alerts"
            description="All sensor readings are within normal thresholds and data is synchronized."
          />
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex gap-4 relative">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    alert.isHigh ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-black mb-0.5">{alert.title}</h4>
                  <p className="text-[11px] text-secondary-dark font-medium mb-1">{alert.desc}</p>
                  <span className="text-[9px] text-secondary font-bold uppercase tracking-widest">
                    {alert.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
