"use client";
import React from "react";
import { DashboardStats } from "../../../features/dashboard/components/DashboardStats";
import { EnergyTrendsChart } from "../../../features/dashboard/components/EnergyTrendsChart";
import { SystemHealth } from "../../../features/dashboard/components/SystemHealth";
import { ActivityFeed } from "../../../features/dashboard/components/ActivityFeed";

export default function Dashboard() {
  return (
    <div className="flex flex-col space-y-6 w-full max-w-6xl mx-auto pb-10 mt-10">
      {/* Row 1: Stat Cards */}
      <DashboardStats />

      {/* Row 2: Charts and Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col h-full rounded-2xl overflow-hidden">
          <EnergyTrendsChart />
        </div>
        <div className="lg:col-span-1 flex flex-col h-full">
          <SystemHealth />
        </div>
      </div>

      {/* Row 3: Aktivitas Terbaru */}
      <div className="w-full">
        <ActivityFeed />
      </div>
    </div>
  );
}
