import React from 'react';
import { MonitorStats } from '../../../features/energy-monitor/components/MonitorStats';
import { RealTimeChart } from '../../../features/energy-monitor/components/RealTimeChart';
import { BuildingConsumption } from '../../../features/energy-monitor/components/BuildingConsumption';
import { CurrentStatusBox } from '../../../features/energy-monitor/components/CurrentStatusBox';
import { TopConsumers } from '../../../features/energy-monitor/components/TopConsumers';
import { UsageAlerts } from '../../../features/energy-monitor/components/UsageAlerts';
import { Button } from '../../ui/Button';

export default function EnergyMonitor() {
  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <div className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">
            Campus Management <span className="text-primary-light mx-1">&gt;</span> <span className="text-primary-dark">Energy Monitor</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-black tracking-tight mb-1">Energy Monitor</h1>
          <p className="text-sm font-medium text-secondary-light">Live telemetry from Arboretum HQ Campus</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="bg-neutral border-none text-secondary-dark font-bold hover:bg-neutral-border/40 px-4">
            Last 24 Hours
          </Button>
          <Button variant="secondary" className="bg-neutral border-none text-secondary-dark font-bold hover:bg-neutral-border/40 px-4">
            Export Data
          </Button>
        </div>
      </div>

      <MonitorStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col">
          <RealTimeChart />
          <BuildingConsumption />
        </div>
        <div className="lg:col-span-1 flex flex-col">
          <CurrentStatusBox />
          <TopConsumers />
          <UsageAlerts />
        </div>
      </div>
    </div>
  );
}
