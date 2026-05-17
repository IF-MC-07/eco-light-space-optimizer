import React from 'react';
import { Plus } from 'lucide-react';
import { RoomStats } from './RoomStats';
import type { Room } from '../types';
import { Button } from '../../../components/ui/Button';
import { useMe } from '../../auth/hooks';

interface RoomHeaderProps {
  rooms: Room[];
  onAddRoom?: () => void;
}

export function RoomHeader({ rooms, onAddRoom }: RoomHeaderProps) {
  const { data: userData } = useMe();
  const role = userData?.user?.role;
  const isAdmin = role === 'admin';

  return (
    <div className="flex flex-col gap-6 w-full mt-5">
      <div className="flex flex-row items-start justify-between w-full">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-black tracking-tight">Room Availability</h1>
          <p className="text-sm text-secondary font-medium mt-1">Optimizing workplace efficiency in real-time.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isAdmin && onAddRoom && (
            <Button 
              onClick={onAddRoom}
              className="bg-primary-dark hover:bg-primary text-white font-bold h-10 px-4 rounded-xl shadow-md flex items-center gap-2 transition-all mr-2"
            >
              <Plus size={18} />
              <span>Add New Room</span>
            </Button>
          )}
        </div>
      </div>
      
      <RoomStats rooms={rooms} />
    </div>
  );
}
