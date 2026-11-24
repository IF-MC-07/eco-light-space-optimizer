import React, { useState } from 'react';
import { Switch } from '../../ui/Switch';
import { MonitorStats } from '../../../features/energy-monitor/components/MonitorStats';
import { RealTimeChart } from '../../../features/energy-monitor/components/RealTimeChart';
import { BuildingConsumption } from '../../../features/energy-monitor/components/BuildingConsumption';
import { CurrentStatusBox } from '../../../features/energy-monitor/components/CurrentStatusBox';
import { TopConsumers } from '../../../features/energy-monitor/components/TopConsumers';
import { UsageAlerts } from '../../../features/energy-monitor/components/UsageAlerts';
import { Button } from '../../ui/Button';
import { ExportReportModal } from '../../../features/dashboard/components/ExportReportModal';

export default function EnergyMonitor() {
  const [showSimulated, setShowSimulated] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col p-6 md:p-8 space-y-6 mt-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-heading font-bold text-black tracking-tight mb-1">Energy Monitor</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="toggle-simulated-energy" className="text-sm font-medium text-slate-700 cursor-pointer">
              Show simulated rooms
            </label>
            <Switch
              id="toggle-simulated-energy"
              checked={showSimulated}
              onCheckedChange={setShowSimulated}
            />
          </div>
          <Button variant="secondary" className="bg-neutral border-none text-secondary-dark font-bold hover:bg-neutral-border/40 px-4">
            Last 24 Hours
          </Button>
          <Button 
            variant="secondary" 
            className="bg-neutral border-none text-secondary-dark font-bold hover:bg-neutral-border/40 px-4"
            onClick={() => setIsExportModalOpen(true)}
          >
            Export Data
          </Button>
        </div>
      </div>
      <MonitorStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col">
          <RealTimeChart />
          <BuildingConsumption filters={{ include_simulated: showSimulated }} />
        </div>
        <div className="lg:col-span-1 flex flex-col">
          <CurrentStatusBox />
          <TopConsumers />
          <UsageAlerts />
        </div>
      </div>

      {/* Modals */}
      <ExportReportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        reportType="energy"
      />
    </div>
  );
}
