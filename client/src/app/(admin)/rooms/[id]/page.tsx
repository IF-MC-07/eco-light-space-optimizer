import React from 'react';
import RoomManagement from '../../../../components/pages/admin/RoomManagement';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoomManagement roomId={id} />;
}
