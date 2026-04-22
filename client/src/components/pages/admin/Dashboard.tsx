import React from "react";
import { StatCard } from "../../../features/dashboard/components/StatCard";
import { EnergyTrendsChart } from "../../../features/dashboard/components/EnergyTrendsChart";
import { SystemHealth } from "../../../features/dashboard/components/SystemHealth";
import { EcoScore } from "../../../features/dashboard/components/EcoScore";
import { QuickActions } from "../../../features/dashboard/components/QuickActions";
import { ActivityFeed } from "../../../features/dashboard/components/ActivityFeed";
import { Building, Users, Zap, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="w-full h-full flex flex-col space-y-6 max-w-7xl mx-auto p-6 md:p-8 bg-neutral">
      
      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Rooms" 
          value="128" 
          subtitle="4 newly configured" 
          icon={<Building className="w-6 h-6" />} 
          iconBgClass="bg-[#E2E8F0]" 
          iconColorClass="text-secondary-dark"
        />
        <StatCard 
          title="Occupied Now" 
          value="84" 
          subtitle="12% from last hour" 
          trend="up"
          trendColorClass="text-primary-light"
          icon={<Users className="w-6 h-6" />} 
          iconBgClass="bg-[#D1FAE5]" 
          iconColorClass="text-primary"
          leftBorderClass="border-primary"
        />
        <StatCard 
          title="Energy Saved" 
          value="42.8 kWh" 
          subtitle="Equivalent to 3 trees planted" 
          icon={<Zap className="w-6 h-6 text-white" />} 
          iconBgClass="bg-primary" 
        />
        <StatCard 
          title="Active Alerts" 
          value="02" 
          subtitle="Priority action required" 
          trendColorClass="text-tertiary"
          icon={<AlertTriangle className="w-6 h-6" />} 
          iconBgClass="bg-[#FCE7F3]" 
          iconColorClass="text-tertiary"
        />
      </div>

      {/* Row 2: Charts and Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col h-full rounded-2xl overflow-hidden bg-[#F5F7F5]">
          <EnergyTrendsChart />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="flex-1 min-h-[180px]">
            <SystemHealth />
          </div>
          <div className="flex-1 min-h-[180px]">
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
