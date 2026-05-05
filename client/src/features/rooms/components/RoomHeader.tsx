import React from 'react';
import { Clock } from 'lucide-react';
import { useRoomStats } from '../hooks';
import { RoomStats } from './RoomStats';
import { RoomFilters } from '../types';

interface RoomHeaderProps {
  filters?: RoomFilters;
  onFilterChange?: (filters: Partial<RoomFilters>) => void;
}

export function RoomHeader({ filters, onFilterChange }: RoomHeaderProps) {
  const { data, isLoading } = useRoomStats();
  const stats = data?.data;

  return (
    <div className="flex flex-col gap-6 w-full mt-5">
      <div className="flex flex-row items-start justify-between w-full">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-black tracking-tight">Room Availability</h1>
          <p className="text-sm text-secondary font-medium mt-1">Optimizing workplace efficiency in real-time.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={filters?.building || ""}
            onChange={(e) => onFilterChange && onFilterChange({ building: e.target.value })}
            className="flex items-center justify-between px-4 py-2.5 bg-white border border-neutral-border rounded-md text-sm font-semibold text-black shadow-sm hover:border-primary/50 transition-colors w-36 outline-none cursor-pointer"
          >
            <option value="">All Buildings</option>
            <option value="A">Building A</option>
            <option value="B">Building B</option>
          </select>
          
          <select 
            value={filters?.floor || ""}
            onChange={(e) => onFilterChange && onFilterChange({ floor: e.target.value ? parseInt(e.target.value) : undefined })}
            className="flex items-center justify-between px-4 py-2.5 bg-white border border-neutral-border rounded-md text-sm font-semibold text-black shadow-sm hover:border-primary/50 transition-colors w-32 outline-none cursor-pointer"
          >
            <option value="">All Floors</option>
            <option value="1">Floor 1</option>
            <option value="2">Floor 2</option>
            <option value="3">Floor 3</option>
          </select>

          <button className="flex items-center justify-center px-4 py-2.5 bg-neutral-border/50 rounded-md text-sm font-bold text-black shadow-sm hover:bg-neutral-border transition-colors">
            <Clock size={16} className="mr-2" />
            Now - 2:00 PM
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="h-32 bg-[#F8FAFC] border border-neutral-border rounded-xl flex items-center justify-center text-secondary-light">
          Loading statistics...
        </div>
      ) : stats ? (
        <RoomStats stats={stats} />
      ) : null}
    </div>
  );
}
