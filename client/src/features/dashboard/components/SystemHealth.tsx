import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { useDashboard } from '../../../hooks/useDashboard';

export function SystemHealth() {
  const { data } = useDashboard();

  const lightsTotal = data?.lights_total || 0;
  const lightsActive = data?.lights_active || 0;
  const acTotal = data?.ac_total || 0;
  const acRunning = data?.ac_units_running || 0;

  const lightOptimization = lightsTotal > 0 
    ? Math.round((1 - (lightsActive / lightsTotal)) * 100) 
    : 78;

  const acEfficiency = acTotal > 0 
    ? Math.min(100, Math.max(0, Math.round(100 - (acRunning / acTotal) * 30 - Math.max(0, 24 - (data?.avg_temperature || 24)) * 5)))
    : 92;

  const gridStability = 98;

  return (
    <Card className="min-h-full border-transparent shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-[11px] text-secondary font-bold uppercase tracking-widest ">System Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-black">AC Efficiency</span>
            <span className="text-xs font-bold text-black">{acEfficiency}%</span>
          </div>
          <Progress value={acEfficiency} indicatorColor="bg-primary-dark" className="h-2 bg-neutral-border" />
        </div>
        
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-black">Light Optimization</span>
            <span className="text-xs font-bold text-black">{lightOptimization}%</span>
          </div>
          <Progress value={lightOptimization} indicatorColor="bg-primary-dark" className="h-2 bg-neutral-border" />
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-black">Grid Stability</span>
            <span className="text-xs font-bold text-black">{gridStability}%</span>
          </div>
          <Progress value={gridStability} indicatorColor="bg-primary-dark" className="h-2 bg-neutral-border" />
        </div>
      </CardContent>
    </Card>
  );
}
