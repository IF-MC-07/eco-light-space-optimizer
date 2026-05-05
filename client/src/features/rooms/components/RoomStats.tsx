import React from 'react';
import { DoorOpen, Ban, Users, Activity, MonitorOff } from 'lucide-react';
import { RoomStats as RoomStatsType } from '../types';

interface RoomStatsProps {
  stats: RoomStatsType;
}

export function RoomStats({ stats }: RoomStatsProps) {
  // Mock efficiency score calculation or value since it's not in stats
  const efficiency = stats.totalRooms ? Math.round((stats.activeRooms / stats.totalRooms) * 100) : 0;

  return (
    <div className="w-full bg-[#F8FAFC] border border-neutral-border rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      {/* Left side - Efficiency Score */}
      <div className="flex flex-col ml-2">
        <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Efficiency Score</p>
        <div className="flex items-baseline">
          <h2 className="text-5xl font-heading font-black text-primary-dark">{efficiency}%</h2>
          <span className="ml-2 text-sm font-bold text-primary flex items-center">
            <span className="text-[10px] mr-0.5">↑</span>Active
          </span>
        </div>
      </div>

      {/* Right side - Cards */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Total Rooms Card */}
        <div className="bg-white rounded-lg p-4 flex items-center gap-4 w-40 shadow-sm border border-neutral-border">
          <div className="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <Users size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-heading font-bold text-black leading-none">{stats.totalRooms}</h3>
            <p className="text-[11px] text-secondary font-medium">Total Rooms</p>
          </div>
        </div>

        {/* Active Rooms Card */}
        <div className="bg-white rounded-lg p-4 flex items-center gap-4 w-40 shadow-sm border border-neutral-border">
          <div className="w-10 h-10 rounded-md bg-[#bbf7d0] flex items-center justify-center text-primary shrink-0">
            <DoorOpen size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-heading font-bold text-black leading-none">{stats.activeRooms}</h3>
            <p className="text-[11px] text-secondary font-medium">Active Rooms</p>
          </div>
        </div>

        {/* Online Devices Card */}
        <div className="bg-white rounded-lg p-4 flex items-center gap-4 w-44 shadow-sm border border-neutral-border">
          <div className="w-10 h-10 rounded-md bg-green-100 flex items-center justify-center text-green-700 shrink-0">
            <Activity size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-heading font-bold text-black leading-none">{stats.onlineDevices}</h3>
            <p className="text-[11px] text-secondary font-medium">Online Devices</p>
          </div>
        </div>

        {/* Offline Devices Card */}
        <div className="bg-white rounded-lg p-4 flex items-center gap-4 w-44 shadow-sm border border-neutral-border">
          <div className="w-10 h-10 rounded-md bg-red-100 flex items-center justify-center text-red-700 shrink-0">
            <MonitorOff size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-heading font-bold text-black leading-none">{stats.offlineDevices}</h3>
            <p className="text-[11px] text-secondary font-medium">Offline Devices</p>
          </div>
        </div>
      </div>
    </div>
  );
}
