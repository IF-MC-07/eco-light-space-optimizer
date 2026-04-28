import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { DoorOpen, MoreVertical } from 'lucide-react';

const roomsData = [
  { id: 1, name: 'Room 701', lightActive: true, acActive: true, temp: '23', actionState: true },
  { id: 2, name: 'Room 701', lightActive: true, acActive: true, temp: 'Active', actionState: true },
  { id: 3, name: 'Room 801', lightActive: false, acActive: false, temp: 'Off', actionState: false },
  { id: 4, name: 'Room 701', lightActive: true, acActive: true, temp: '20', actionState: true },
  { id: 5, name: 'Room 701', lightActive: true, acActive: true, temp: '21', actionState: true },
  { id: 6, name: 'Room 801', lightActive: false, acActive: false, temp: 'Off', actionState: false },
  { id: 7, name: 'Room 801', lightActive: false, acActive: false, temp: 'Off', actionState: false },
];

export function DeviceStatusTable() {
  const [rooms, setRooms] = useState(roomsData);

  const toggleRoom = (id: number) => {
    setRooms(rooms.map(room => room.id === id ? { ...room, actionState: !room.actionState } : room));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg text-black font-heading font-bold">Device Status by Room</CardTitle>
        <a href="#" className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors">View History</a>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-secondary font-bold uppercase tracking-wider border-b border-neutral-border">
              <tr>
                <th className="pb-3 px-4">Room</th>
                <th className="pb-3 px-4">Lighting</th>
                <th className="pb-3 px-4">AC Status</th>
                <th className="pb-3 px-4">Temp(°C)</th>
                <th className="pb-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border/50">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-neutral/50 transition-colors">
                  <td className="py-4 px-4 font-semibold text-black flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-neutral border border-neutral-border flex items-center justify-center text-secondary">
                      <DoorOpen size={16} />
                    </div>
                    {room.name}
                  </td>
                  <td className="py-4 px-4">
                    <div className={`flex items-center text-sm font-medium ${room.lightActive ? 'text-primary-dark' : 'text-secondary-light'}`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${room.lightActive ? 'bg-primary' : 'bg-secondary-light'}`}></span>
                      {room.lightActive ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className={`flex items-center text-sm font-medium ${room.acActive ? 'text-primary-dark' : 'text-secondary-light'}`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${room.acActive ? 'bg-primary' : 'bg-secondary-light'}`}></span>
                      {room.acActive ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-sm font-medium ${room.temp === 'Off' ? 'text-secondary-light' : 'text-primary-dark'}`}>
                      {room.temp}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {/* Simple Toggle Switch */}
                      <button 
                        onClick={() => toggleRoom(room.id)}
                        className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${room.actionState ? 'bg-primary-dark' : 'bg-neutral-border'}`}
                      >
                        <span 
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm ${room.actionState ? 'left-[22px]' : 'left-1'}`}
                        />
                      </button>
                      <button className="text-secondary hover:text-black transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
