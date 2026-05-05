import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { MapPin, MonitorSmartphone } from 'lucide-react';
import { Room, RoomStatus } from '../types';

export function RoomCard({ room, onClick }: { room: Room, onClick?: () => void }) {
  const isAvailable = room.status === RoomStatus.ACTIVE;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-5 flex flex-col h-full mt-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-heading font-bold text-black">{room.name}</h3>
          <Badge 
            className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide border-transparent ${
              isAvailable ? 'bg-[#bbf7d0] text-primary' : 'bg-tertiary/10 text-tertiary'
            }`}
          >
            {room.status}
          </Badge>
        </div>
        
        <div className="flex items-center text-xs text-secondary mb-2">
          <MapPin size={12} className="mr-1" />
          {room.building}, Floor {room.floor}
        </div>

        <div className="flex items-center text-xs text-secondary mb-6">
          <MonitorSmartphone size={12} className="mr-1" />
          {room.devices?.length || 0} Devices
        </div>

        <div className="mt-auto space-y-2 mb-5">
          {isAvailable ? (
            <div className="text-xs font-bold text-primary">
              Available
            </div>
          ) : (
            <div className="flex justify-between items-center text-xs">
              <span className="text-secondary font-medium">Currently</span>
              <span className="font-bold text-tertiary">Occupied / Maintenance</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
