import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Lightbulb, Snowflake, Thermometer, Leaf } from 'lucide-react';
import { useMonitoring } from '../../../hooks/useMonitoring';

export function LightingACStats() {
  const { fetchStats } = useMonitoring();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats().then(res => {
      if (res.success && res.data) {
        setStats(res.data);
      }
    });
  }, [fetchStats]);

  const activeLights = stats ? `${stats.lights_active} / ${stats.lights_total}` : '12 / 18';
  const activeAc = stats ? String(stats.ac_units_running).padStart(2, '0') : '02';
  const avgTemp = stats ? `${stats.avg_temperature}°C` : '21.5°C';
  const energyMode = stats ? stats.energy_mode : 'ECO';

  const statCards = [
    {
      title: 'Lights Active',
      value: activeLights,
      badgeText: 'HIGH EFFICIENCY',
      badgeColor: 'bg-[#bbf7d0] text-primary',
      icon: Lightbulb,
      iconColor: 'text-primary bg-[#bbf7d0]',
    },
    {
      title: 'AC Units Running',
      value: activeAc,
      badgeText: 'OPTIMIZED FLOW',
      badgeColor: 'bg-blue-100 text-blue-700',
      icon: Snowflake,
      iconColor: 'text-blue-700 bg-blue-100',
    },
    {
      title: 'Avg. Temperature',
      value: avgTemp,
      badgeText: 'COMFORT ZONE',
      badgeColor: 'bg-primary-dark text-white',
      icon: Thermometer,
      iconColor: 'text-white bg-primary-dark',
    },
    {
      title: 'Energy Mode',
      value: energyMode,
      badgeText: 'SUSTAINED',
      badgeColor: 'bg-[#bbf7d0] text-primary',
      icon: Leaf,
      iconColor: 'text-primary bg-[#bbf7d0]',
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-6">
      {statCards.map((stat, i) => (
        <Card key={i} className="relative overflow-hidden">
          <div className="absolute -top-4 -right-4 opacity-[0.03] pointer-events-none">
            <stat.icon size={120} />
          </div>
          <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full mt-5">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-6 ${stat.iconColor}`}>
              <stat.icon size={16} />
            </div>
            <div>
              <p className="text-xs text-secondary-dark font-semibold mb-1">{stat.title}</p>
              <div className="flex items-end mb-4">
                <h3 className="text-3xl font-heading font-bold text-black">{stat.value}</h3>
              </div>
              <Badge className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide border-transparent mb-6 ${stat.badgeColor}`}>
                {stat.badgeText}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
