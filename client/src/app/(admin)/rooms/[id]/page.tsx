import React from 'react';
import RoomManagement from '../../../../components/pages/admin/RoomManagement';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoomManagement roomId={id} />;
}

export async function generateStaticParams() {
  try {
    // We use dynamic import or axios to fetch the rooms API
    const { roomsApi } = await import('../../../../features/rooms/api');
    const response = await roomsApi.getAll();
    const rooms = response.data || [];
    
    return rooms.map((room: any) => ({
      id: room.room_id?.toString() || room.id?.toString(),
    }));
  } catch (error) {
    console.warn("Could not fetch rooms for static generation. Fallback to default.", error);
    return [{ id: '1' }];
  }
}
