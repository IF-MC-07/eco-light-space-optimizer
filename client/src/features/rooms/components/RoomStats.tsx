import React from 'react';
import { DoorOpen, Ban, Users } from 'lucide-react';

export function RoomStats() {
  return (
    <div className="w-full bg-[#F8FAFC] border border-neutral-border rounded-xl p-6 flex items-center justify-between">
      {/* Left side - Efficiency Score */}
      <div className="flex flex-col ml-2">
        <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Efficiency Score</p>
        <div className="flex items-baseline">
          <h2 className="text-5xl font-heading font-black text-primary-dark">94%</h2>
          <span className="ml-2 text-sm font-bold text-primary flex items-center">
            <span className="text-[10px] mr-0.5">↑</span>12%
          </span>
        </div>
      </div>

      {/* Right side - 3 Cards */}
      <div className="flex items-center gap-4">
        {/* Available Card */}
        <div className="bg-white rounded-lg p-4 flex items-center gap-4 w-44 shadow-sm border border-neutral-border">
          <div className="w-10 h-10 rounded-md bg-[#bbf7d0] flex items-center justify-center text-primary shrink-0">
            <DoorOpen size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-heading font-bold text-black leading-none">16</h3>
            <p className="text-[11px] text-secondary font-medium">Available Now</p>
          </div>
        </div>

        {/* Occupied Card */}
        <div className="bg-white rounded-lg p-4 flex items-center gap-4 w-44 shadow-sm border border-neutral-border">
          <div className="w-10 h-10 rounded-md bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
            <Ban size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-heading font-bold text-black leading-none">8</h3>
            <p className="text-[11px] text-secondary font-medium">Occupied</p>
          </div>
        </div>

        {/* Total Capacity Card */}
        <div className="bg-white rounded-lg p-4 flex items-center gap-4 w-44 shadow-sm border border-neutral-border">
          <div className="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <Users size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-heading font-bold text-black leading-none">142</h3>
            <p className="text-[11px] text-secondary font-medium">Total Capacity</p>
          </div>
        </div>
      </div>
    </div>
  );
}
