import React from 'react';
import { LightingACStats } from '../../../features/monitoring/components/LightingACStats';
import { DeviceStatusTable } from '../../../features/monitoring/components/DeviceStatusTable';
import { MasterControls } from '../../../features/monitoring/components/MasterControls';
import { TargetClimate } from '../../../features/monitoring/components/TargetClimate';

export default function LightingAndAC() {
  return (
    <div className="flex flex-col space-y-6 w-full max-w-6xl mx-auto mt-5">
      {/* Top Stat Cards */}
      <LightingACStats />

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column (Span 2) - Device Status by Room */}
        <div className="col-span-2 space-y-6">
          <DeviceStatusTable />
        </div>

        {/* Right Column (Span 1) */}
        <div className="col-span-1 space-y-6">
          <MasterControls />
          <TargetClimate />
        </div>
      </div>
    </div>
  );
}
