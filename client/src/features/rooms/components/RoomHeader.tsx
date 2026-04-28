import React from 'react';
import { ChevronDown, Layers, Clock } from 'lucide-react';

export function RoomHeader() {
  return (
    <div className="flex flex-row items-start justify-between w-full">
      <div>
        <h1 className="text-3xl font-heading font-extrabold text-black tracking-tight">Room Availability</h1>
        <p className="text-sm text-secondary font-medium mt-1">Optimizing workplace efficiency in real-time.</p>
      </div>
      
      <div className="flex items-center gap-3">
        <button className="flex items-center justify-between px-4 py-2.5 bg-white border border-neutral-border rounded-md text-sm font-semibold text-black shadow-sm hover:border-primary/50 transition-colors w-32">
          Building A
          <ChevronDown size={16} className="text-secondary" />
        </button>
        
        <button className="flex items-center justify-between px-4 py-2.5 bg-white border border-neutral-border rounded-md text-sm font-semibold text-black shadow-sm hover:border-primary/50 transition-colors w-28">
          Floor 1
          <Layers size={16} className="text-secondary" />
        </button>

        <button className="flex items-center justify-center px-4 py-2.5 bg-neutral-border/50 rounded-md text-sm font-bold text-black shadow-sm hover:bg-neutral-border transition-colors">
          <Clock size={16} className="mr-2" />
          Now - 2:00 PM
        </button>
      </div>
    </div>
  );
}
