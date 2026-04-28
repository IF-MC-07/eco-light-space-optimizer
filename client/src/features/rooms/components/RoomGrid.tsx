import React from 'react';
import { RoomCard, Room } from './RoomCard';

const dummyRooms: Room[] = [
  { id: '1', name: 'Room 603', location: 'Gedung Utama Lt. 6', status: 'AVAILABLE', timeInfo: '2:30 PM Today' },
  { id: '2', name: 'Room 602', location: 'Gedung Utama Lt. 6', status: 'OCCUPIED', timeInfo: '45 Minutes', session: 'Dasar Pemrograman' },
  { id: '3', name: 'Room 601', location: 'Gedung Utama Lt. 6', status: 'AVAILABLE', timeInfo: '45 Minutes', session: 'Dasar Pemrograman' },
  { id: '4', name: 'Room 606', location: 'Gedung Utama Lt. 6', status: 'AVAILABLE', timeInfo: 'All Day Open' },
  { id: '5', name: 'Room 605', location: 'Gedung Utama Lt. 6', status: 'AVAILABLE', timeInfo: 'All Day Open' },
  { id: '6', name: 'Room 604', location: 'Gedung Utama Lt. 6', status: 'OCCUPIED', timeInfo: '45 Minutes', session: 'Dasar Pemrograman' },
  { id: '7', name: 'Room 703', location: 'Gedung Utama Lt. 7', status: 'AVAILABLE', timeInfo: 'All Day Open' },
  { id: '8', name: 'Room 702', location: 'Gedung Utama Lt. 7', status: 'AVAILABLE', timeInfo: 'All Day Open' },
  { id: '9', name: 'Room 701', location: 'Gedung Utama Lt. 7', status: 'AVAILABLE', timeInfo: 'All Day Open' },
  { id: '10', name: 'Room 706', location: 'Gedung Utama Lt. 7', status: 'OCCUPIED', timeInfo: '45 Minutes', session: 'Dasar Pemrograman' },
  { id: '11', name: 'Room 705', location: 'Gedung Utama Lt. 7', status: 'AVAILABLE', timeInfo: 'All Day Open' },
  { id: '12', name: 'Room 704', location: 'Gedung Utama Lt. 7', status: 'OCCUPIED', timeInfo: '45 Minutes', session: 'Dasar Pemrograman' },
  { id: '13', name: 'Room 803', location: 'Gedung Utama Lt. 7', status: 'OCCUPIED', timeInfo: '45 Minutes', session: 'Dasar Pemrograman' },
  { id: '14', name: 'Room 802', location: 'Gedung Utama Lt. 7', status: 'OCCUPIED', timeInfo: '45 Minutes', session: 'Dasar Pemrograman' },
  { id: '15', name: 'Room 801', location: 'Gedung Utama Lt. 7', status: 'AVAILABLE', timeInfo: 'All Day Open' },
  { id: '16', name: 'Room 806', location: 'Gedung Utama Lt. 8', status: 'OCCUPIED', timeInfo: '45 Minutes', session: 'Dasar Pemrograman' },
  { id: '17', name: 'Room 805', location: 'Gedung Utama Lt. 8', status: 'OCCUPIED', timeInfo: '45 Minutes', session: 'Dasar Pemrograman' },
  { id: '18', name: 'Room 804', location: 'Gedung Utama Lt. 8', status: 'AVAILABLE', timeInfo: 'All Day Open' },
];

// Note: In Room 601 in wireframe, it says "AVAILABLE" but also has "45 Minutes" and "Dasar Pemrograman". This looks like a mistake in the wireframe design, but I've replicated it.

export function RoomGrid() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {dummyRooms.map(room => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
