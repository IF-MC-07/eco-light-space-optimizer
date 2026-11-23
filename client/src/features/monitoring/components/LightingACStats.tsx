"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Lightbulb, Snowflake, Thermometer } from 'lucide-react';
import { useMonitoring } from '../../../hooks/useMonitoring';

export function LightingACStats() {
  const { fetchDevices } = useMonitoring();
  const [devices, setDevices] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices().then(res => {
      if (res.success && res.data) {
        setDevices(res.data);
      } else {
        setDevices([]);
      }
      setLoading(false);
    });
  }, [fetchDevices]);

  const allLightControls = devices ? devices.flatMap((d: any) => d.light_controls || []) : [];
  const activeLightsCount = allLightControls.filter((l: any) => ['on', 'active', 'ON', 'ACTIVE'].includes(l.light_status)).length;
  const totalLightsCount = allLightControls.length;

  const allAcControls = devices ? devices.flatMap((d: any) => d.ac_controls || []) : [];
  const activeAcCount = allAcControls.filter((a: any) => ['on', 'active', 'ON', 'ACTIVE'].includes(a.ac_status)).length;
  const totalAcCount = allAcControls.length;

  const setpoints = allAcControls
    .map((a: any) => parseFloat(a.temperature_setting))
    .filter((t: number) => !isNaN(t));
  const avgSetpoint = setpoints.length > 0
    ? (setpoints.reduce((sum: number, val: number) => sum + val, 0) / setpoints.length).toFixed(1)
    : null;

  const cards = [
    {
      title: 'Lampu Menyala',
      value: loading
        ? '...'
        : totalLightsCount === 0
        ? 'Belum ada lampu terdaftar'
        : `${activeLightsCount} / ${totalLightsCount}`,
      subtitle: totalLightsCount === 0
        ? 'Tambahkan lampu di Manajemen Ruangan'
        : `${activeLightsCount} dari ${totalLightsCount} lampu menyala`,
      icon: Lightbulb,
      iconColor: 'text-primary bg-[#bbf7d0]',
      isAvailable: true,
      isTextOnly: totalLightsCount === 0,
    },
    {
      title: 'AC Aktif',
      value: loading
        ? '...'
        : totalAcCount === 0
        ? 'Belum ada AC terdaftar'
        : String(activeAcCount).padStart(2, '0'),
      subtitle: totalAcCount === 0
        ? 'Tambahkan unit AC di Manajemen Ruangan'
        : 'menurut perintah terakhir',
      icon: Snowflake,
      iconColor: 'text-blue-700 bg-blue-100',
      isAvailable: true,
      isTextOnly: totalAcCount === 0,
    },
    // Setpoint AC rata-rata: hanya bila >= 1 AC terdaftar
    ...(totalAcCount >= 1
      ? [
          {
            title: 'Setpoint AC rata-rata',
            value: loading ? '...' : avgSetpoint !== null ? `${avgSetpoint}°C` : '—',
            subtitle: `dari ${totalAcCount} unit AC terdaftar`,
            icon: Thermometer,
            iconColor: 'text-white bg-primary-dark',
            isAvailable: true,
            isTextOnly: false,
          },
        ]
      : []),
  ];

  return (
    <div className={`grid grid-cols-1 ${cards.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
      {cards.map((stat, i) => (
        <Card key={i} className="relative overflow-hidden">
          <div className="absolute -top-4 -right-4 opacity-[0.03] pointer-events-none">
            <stat.icon size={120} />
          </div>
          <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-4 ${stat.iconColor}`}>
              <stat.icon size={16} />
            </div>
            <div>
              <p className="text-xs text-secondary-dark font-semibold mb-1">{stat.title}</p>
              <div className="flex items-end mb-2">
                <h3 className={`font-heading font-bold text-black ${stat.isTextOnly ? 'text-lg leading-tight' : 'text-3xl'}`}>
                  {stat.value}
                </h3>
              </div>
              <p className="text-[11px] text-secondary font-medium">
                {stat.subtitle}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
