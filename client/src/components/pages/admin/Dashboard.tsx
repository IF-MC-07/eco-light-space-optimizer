import React from "react";
import { DashboardStats } from "../../../features/dashboard/components/DashboardStats";
import { EnergyTrendsChart } from "../../../features/dashboard/components/EnergyTrendsChart";
import { SystemHealth } from "../../../features/dashboard/components/SystemHealth";
import { EcoScore } from "../../../features/dashboard/components/EcoScore";
import { QuickActions } from "../../../features/dashboard/components/QuickActions";
import { ActivityFeed } from "../../../features/dashboard/components/ActivityFeed";

export default function Dashboard() {
  return (
    <div className="flex flex-col space-y-6 w-full max-w-6xl mx-auto pb-10 mt-10">
      
      {/* Row 1: Stat Cards */}
      <DashboardStats />

      {/* Row 2: Charts and Health */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col h-full rounded-2xl overflow-hidden">
          <EnergyTrendsChart />
        </div>
        <div className="col-span-1 flex flex-col gap-6">
          <div className="flex-1">
            <SystemHealth />
          </div>
          <div className="h-40">
            <EcoScore />
          </div>
        </div>
      </div>

      {/* Row 3: Quick Actions */}
      <QuickActions />

      {/* Row 4: Recent Alerts */}
      <div className="w-full">
        <ActivityFeed />
      </div>

    </div>
  );
}
