import React from 'react';
import { RoomHeader } from '../../../features/rooms/components/RoomHeader';
import { RoomStats } from '../../../features/rooms/components/RoomStats';
import { RoomGrid } from '../../../features/rooms/components/RoomGrid';
import { Calendar } from 'lucide-react';

export default function RoomAvailability() {
  return (
    <div className="flex flex-col space-y-6 w-full max-w-6xl mx-auto h-full min-h-full">
      <RoomHeader />
      <RoomStats />
      <div className="flex-1">
        <RoomGrid />
      </div>

      {/* Footer - specifically mapped from the wireframe */}
      <footer className="mt-8 pt-4 border-t border-neutral-border flex items-center justify-between text-xs font-semibold text-secondary pb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
            Live System Sync Active
          </div>
          <div className="flex items-center">
            <Calendar size={14} className="mr-2" />
            Last Updated: 1:42 PM
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="flex items-center hover:text-primary transition-colors">
            <span className="mr-1">🛡</span> System Support
          </a>
        </div>
      </footer>
    </div>
  );
}
