import React, { useState, useEffect, useMemo } from 'react';
import { RoomHeader } from '../../../features/rooms/components/RoomHeader';
import { OccupancyGrid } from '../../../features/occupancy/components/OccupancyGrid';
import { Calendar } from 'lucide-react';
import { AddRoomModal } from '../../../features/rooms/components/AddRoomModal';
import { RoomSummaryModal } from '../../../features/rooms/components/RoomSummaryModal';
import { AlertDialog } from '../../../components/ui/AlertDialog';
import { useMe } from '../../../features/auth/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useRemoveRoom } from '../../../features/rooms/hooks';
import { useOccupancy, occupancyQueryKeys } from '../../../features/occupancy/hooks';
import type { RoomOccupancy } from '../../../features/occupancy/types';
import { RoomStatus, type Room } from '../../../features/rooms/types';

export default function RoomAvailability() {
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [showSimulated, setShowSimulated] = useState(true);
  const { data: userData } = useMe();
  const role = userData?.user?.role;
  const isAdmin = role === 'admin';

  const [roomToDelete, setRoomToDelete] = useState<{ room_id: string; room_name: string } | null>(null);
  const [selectedOccupancy, setSelectedOccupancy] = useState<RoomOccupancy | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const queryClient = useQueryClient();
  const { data: response, isLoading, isError, refetch } = useOccupancy({
    include_simulated: showSimulated,
  });
  const { mutate: deleteRoom } = useRemoveRoom();

  const occupancyList = response?.data || [];

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [response]);

  const handleConfirmDelete = () => {
    if (roomToDelete) {
      deleteRoom(roomToDelete.room_id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: occupancyQueryKeys.all });
        },
      });
      setRoomToDelete(null);
    }
  };

  // Adaptasi daftar occupancy ke tipe Room untuk statistik RoomHeader
  const roomsAdapter: Room[] = useMemo(() => {
    return occupancyList.map((item) => ({
      room_id: item.room_id,
      room_name: item.room_name,
      location: item.location || (item.building ? `${item.building} · Lantai ${item.floor ?? '-'}` : ''),
      capacity: item.capacity ?? 0,
      status: RoomStatus.ACTIVE,
      availability: item.status === 'Padat' ? 'occupied' : 'available',
    }));
  }, [occupancyList]);

  // Adaptasi item occupancy terpilih ke tipe Room untuk RoomSummaryModal
  const selectedRoom: Room | null = useMemo(() => {
    if (!selectedOccupancy) return null;
    return {
      room_id: selectedOccupancy.room_id,
      room_name: selectedOccupancy.room_name,
      location: selectedOccupancy.location || (selectedOccupancy.building ? `${selectedOccupancy.building} · Lantai ${selectedOccupancy.floor ?? '-'}` : 'Gedung belum diatur'),
      capacity: selectedOccupancy.capacity ?? 0,
      status: RoomStatus.ACTIVE,
      availability: selectedOccupancy.status === 'Padat' ? 'occupied' : 'available',
    };
  }, [selectedOccupancy]);

  return (
    <div className="flex flex-col space-y-6 w-full max-w-6xl mx-auto h-full min-h-full">
      <RoomHeader 
        rooms={roomsAdapter}
        {...(isAdmin ? { onAddRoom: () => setIsAddRoomOpen(true) } : {})}
      />
      
      <div className="flex-1 mt-4">
        <OccupancyGrid 
          occupancyList={occupancyList}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          showSimulated={showSimulated}
          onToggleSimulated={setShowSimulated}
          onSelectRoom={(occ) => setSelectedOccupancy(occ)}
          {...(isAdmin ? { onDeleteRoom: (occ) => setRoomToDelete({ room_id: occ.room_id, room_name: occ.room_name }) } : {})}
        />
      </div>

      <AddRoomModal 
        isOpen={isAddRoomOpen} 
        onClose={() => setIsAddRoomOpen(false)} 
      />

      {selectedRoom && (
        <RoomSummaryModal
          isOpen={true}
          onClose={() => setSelectedOccupancy(null)}
          room={selectedRoom}
        />
      )}

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
