"use client";
import React, { useState } from 'react';
import { RoomCard } from './RoomCard';
import { RoomSummaryModal } from './RoomSummaryModal';
import { RoomFilters } from '../types';
import { MOCK_ROOMS } from '../../../mocks/roomData';

export function RoomGrid({ filters }: { filters?: RoomFilters }) {
  const rooms = MOCK_ROOMS;
  
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const selectedRoom = rooms.find(r => r.id === selectedRoomId) ?? null;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.length === 0 ? (
          <div className="col-span-full text-center py-10 text-secondary-light">No rooms found.</div>
        ) : (
          rooms.map(room => (
            <RoomCard 
              key={room.id} 
              room={room as any} 
              onClick={() => setSelectedRoomId(room.id)}
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
