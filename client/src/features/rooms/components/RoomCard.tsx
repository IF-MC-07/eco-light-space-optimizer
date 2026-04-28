import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { MapPin } from 'lucide-react';

export interface Room {
  id: string;
  name: string;
  location: string;
  status: 'AVAILABLE' | 'OCCUPIED';
  timeInfo: string;
  session?: string;
}

export function RoomCard({ room }: { room: Room }) {
  const isAvailable = room.status === 'AVAILABLE';

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
        
        <div className="flex items-center text-xs text-secondary mb-6">
          <MapPin size={12} className="mr-1" />
          {room.location}
        </div>

        <div className="mt-auto space-y-2 mb-5">
          {isAvailable ? (
            <div className="text-xs font-bold text-primary">
              {room.timeInfo}
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary font-medium">Available In</span>
                <span className="font-bold text-tertiary">{room.timeInfo}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary font-medium">In Session</span>
                <span className="font-bold text-tertiary">{room.session}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
