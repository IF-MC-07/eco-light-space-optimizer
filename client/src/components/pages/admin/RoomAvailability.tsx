import React, { useState, useEffect } from 'react';
import { RoomHeader } from '../../../features/rooms/components/RoomHeader';
import { RoomGrid } from '../../../features/rooms/components/RoomGrid';
import { Calendar } from 'lucide-react';
import { AddRoomModal } from '../../../features/rooms/components/AddRoomModal';
import { AlertDialog } from '../../../components/ui/AlertDialog';

import { useRooms, useRemoveRoom } from '../../../features/rooms/hooks';
import { Room } from '../../../features/rooms/types';

export default function RoomAvailability() {
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);

  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  const { data: response, isLoading, isError } = useRooms();
  const { mutate: deleteRoom } = useRemoveRoom();

  const rooms = response?.data || [];

  const handleConfirmDelete = () => {
    if (roomToDelete) {
      deleteRoom(roomToDelete.room_id);
      setRoomToDelete(null);
    }
  };

  return (
    <div className="flex flex-col space-y-6 w-full max-w-6xl mx-auto h-full min-h-full">
      <RoomHeader 
        rooms={rooms}
        onAddRoom={() => setIsAddRoomOpen(true)}
      />
      
      <div className="flex-1 mt-4">
        <RoomGrid 
          rooms={rooms}
          isLoading={isLoading}
          isError={isError}
          onDeleteRoom={(room) => setRoomToDelete(room)}
        />
      </div>

      <AddRoomModal 
        isOpen={isAddRoomOpen} 
        onClose={() => setIsAddRoomOpen(false)} 
      />

      <AlertDialog 
        isOpen={!!roomToDelete}
        onClose={() => setRoomToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Room?"
        description={
          <span>
            Are you sure you want to delete <strong>{roomToDelete?.room_name}</strong>? This action is <strong>irreversible</strong>.
          </span>
        }
        confirmText="Delete Room"
        cancelText="Cancel"
      />



      <footer className="mt-8 pt-4 border-t border-neutral-border flex items-center justify-between text-xs font-semibold text-secondary pb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
            Live System Sync Active
          </div>
          <div className="flex items-center">
            <Calendar size={14} className="mr-2" />
            Last Updated: {lastUpdated || "--:--"}
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
