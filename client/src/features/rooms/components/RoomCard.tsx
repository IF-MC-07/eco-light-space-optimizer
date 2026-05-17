import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { MapPin, Users, Trash2 } from 'lucide-react';
import type { Room } from '../types';

interface RoomCardProps {
  room: Room;
  onClick?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export function RoomCard({ room, onClick, onDelete }: RoomCardProps) {
  const isAvailable = room.status === 'ACTIVE';

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer relative group" onClick={onClick}>
      {onDelete && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-tertiary hover:text-white z-10"
          title="Delete Room"
        >
          <Trash2 size={14} />
        </button>
      )}
      <CardContent className="p-5 flex flex-col h-full mt-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-heading font-bold text-black pr-8">{room.room_name}</h3>
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
          {room.location}
        </div>

        <div className="flex items-center text-xs text-secondary mb-4">
          <Users size={12} className="mr-1" />
          Capacity: {room.capacity}
        </div>

        <div className="mt-auto space-y-2 mb-2">
          {isAvailable ? (
            <div className="text-xs font-bold text-primary">
              Available
            </div>
          ) : (
            <div className="flex justify-between items-center text-xs">
              <span className="text-secondary font-medium">Currently</span>
              <span className="font-bold text-tertiary">{room.status}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
