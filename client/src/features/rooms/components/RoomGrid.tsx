"use client";
import React, { useState } from 'react';
import { RoomCard } from './RoomCard';
import { RoomSummaryModal } from './RoomSummaryModal';
import { Room } from '../types';

export function RoomGrid({ rooms, isLoading, isError, onDeleteRoom }: { 
  rooms: Room[], 
  isLoading: boolean, 
  isError: boolean,
  onDeleteRoom?: (room: Room) => void 
}) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const selectedRoom = rooms.find(r => String(r.room_id) === String(selectedRoomId)) ?? null;

  if (isLoading) return <div className="text-center py-10">Loading rooms...</div>;
  if (isError) return <div className="text-center py-10 text-red-500">Error loading rooms.</div>;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.length === 0 ? (
          <div className="col-span-full text-center py-10 text-secondary-light">No rooms found.</div>
        ) : (
          rooms.map(room => (
            <RoomCard 
              key={room.room_id} 
              room={room} 
              onClick={() => setSelectedRoomId(room.room_id)}
              onDelete={onDeleteRoom ? () => onDeleteRoom(room) : undefined}
            />
          ))
        )}
      </div>

      {/* Render Modal */}
      {selectedRoom && (
        <RoomSummaryModal 
          isOpen={true}
          onClose={() => setSelectedRoomId(null)}
          room={selectedRoom}
        />
      )}
    </div>
  );
}
