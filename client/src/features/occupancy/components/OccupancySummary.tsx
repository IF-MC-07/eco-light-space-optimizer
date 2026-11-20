import React from 'react';
import { DoorOpen, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { RoomOccupancy } from '../types';
import { useOccupancy } from '../hooks';
import { isAvailableStatus } from '../utils';

interface OccupancySummaryProps {
  items?: RoomOccupancy[];
}

export function OccupancySummary({ items: propItems }: OccupancySummaryProps) {
  const { data: response } = useOccupancy();
  const items = propItems ?? (response?.data || []);

  const totalRooms = items.length;
  const padatRooms = items.filter((r) => r.status === 'Padat').length;
  const tersediaRooms = items.filter((r) => isAvailableStatus(r.status)).length;
  const totalPersons = items.reduce(
    (acc, r) => acc + (r.person_count !== null && r.person_count !== undefined ? r.person_count : 0),
    0
  );

  return (
    <div className="w-full bg-[#F8FAFC] border border-neutral-border rounded-xl p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total ruangan */}
        <div className="bg-white rounded-lg p-4 flex items-center gap-4 shadow-sm border border-neutral-border">
          <div className="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <DoorOpen size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-heading font-bold text-black leading-none">{totalRooms}</h3>
            <p className="text-[11px] text-secondary font-medium mt-1">Total ruangan</p>
          </div>
        </div>

        {/* Padat */}
        <div className="bg-white rounded-lg p-4 flex items-center gap-4 shadow-sm border border-neutral-border">
          <div className="w-10 h-10 rounded-md bg-red-100 flex items-center justify-center text-red-700 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-heading font-bold text-black leading-none">{padatRooms}</h3>
            <p className="text-[11px] text-secondary font-medium mt-1">Padat</p>
          </div>
        </div>

        {/* Tersedia */}
        <div className="bg-white rounded-lg p-4 flex items-center gap-4 shadow-sm border border-neutral-border">
          <div className="w-10 h-10 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-heading font-bold text-black leading-none">{tersediaRooms}</h3>
            <p className="text-[11px] text-secondary font-medium mt-1">Tersedia</p>
          </div>
        </div>

        {/* Orang saat ini */}
        <div className="bg-white rounded-lg p-4 flex items-center gap-4 shadow-sm border border-neutral-border">
          <div className="w-10 h-10 rounded-md bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
            <Users size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-heading font-bold text-black leading-none">{totalPersons}</h3>
            <p className="text-[11px] text-secondary font-medium mt-1">Orang saat ini</p>
          </div>
        </div>
      </div>
    </div>
  );
}

