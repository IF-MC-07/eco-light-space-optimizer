import React from 'react';
import { DoorOpen, Users, Activity, MonitorOff } from 'lucide-react';
import { Room } from '../types';

interface RoomStatsProps {
  rooms: Room[];
}

export function RoomStats({ rooms }: RoomStatsProps) {
  const totalRooms = rooms.length;
  const activeRooms = rooms.filter(r => r.status === 'ACTIVE').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'MAINTENANCE').length;
  const totalCapacity = rooms.reduce((acc, r) => acc + (Number(r.capacity) || 0), 0);
  
  const efficiency = totalRooms ? Math.round((activeRooms / totalRooms) * 100) : 0;

  return (
    <div className="w-full bg-[#F8FAFC] border border-neutral-border rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="flex flex-col ml-2">
        <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Efficiency Score</p>
        <div className="flex items-baseline">
          <h2 className="text-5xl font-heading font-black text-primary-dark">{efficiency}%</h2>
          <span className="ml-2 text-sm font-bold text-primary flex items-center">
            <span className="text-[10px] mr-0.5">↑</span>Active
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="bg-white rounded-lg p-4 flex items-center gap-4 w-40 shadow-sm border border-neutral-border">
          <div className="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <DoorOpen size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-heading font-bold text-black leading-none">{totalRooms}</h3>
            <p className="text-[11px] text-secondary font-medium">Total Rooms</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 flex items-center gap-4 w-40 shadow-sm border border-neutral-border">
          <div className="w-10 h-10 rounded-md bg-[#bbf7d0] flex items-center justify-center text-primary shrink-0">
            <DoorOpen size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-heading font-bold text-black leading-none">{activeRooms}</h3>
            <p className="text-[11px] text-secondary font-medium">Active Rooms</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 flex items-center gap-4 w-44 shadow-sm border border-neutral-border">
          <div className="w-10 h-10 rounded-md bg-green-100 flex items-center justify-center text-green-700 shrink-0">
            <Users size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-heading font-bold text-black leading-none">{totalCapacity}</h3>
            <p className="text-[11px] text-secondary font-medium">Total Capacity</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 flex items-center gap-4 w-44 shadow-sm border border-neutral-border">
          <div className="w-10 h-10 rounded-md bg-red-100 flex items-center justify-center text-red-700 shrink-0">
            <MonitorOff size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-heading font-bold text-black leading-none">{maintenanceRooms}</h3>
            <p className="text-[11px] text-secondary font-medium">Maintenance</p>
          </div>
        </div>
      </div>
    </div>
  );
}
