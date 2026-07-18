import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { usePowerSensors } from '../hooks';

export function TopConsumers() {
  const { data: response } = usePowerSensors();
  const sensors = response || [];

  // Group sensors by room_id, compute average power per room
  const roomMap: Record<string, { room_id: string; power_watts: number[]; name: string }> = {};
  sensors.forEach((s: any) => {
    if (!s.room_id) return;
    let room = roomMap[s.room_id];
    if (!room) {
      room = { room_id: s.room_id, power_watts: [], name: s.Room?.room_name || s.room_id };
      roomMap[s.room_id] = room;
    }
    room.power_watts.push(s.power_watts || 0);
  });

  const roomAverages = Object.values(roomMap).map(r => ({
    name: r.name,
    avg: r.power_watts.reduce((a, b) => a + b, 0) / r.power_watts.length,
  })).sort((a, b) => b.avg - a.avg).slice(0, 5);

  const maxAvg = roomAverages.length > 0 ? Math.max(...roomAverages.map(r => r.avg), 1) : 1;

  const consumers = roomAverages.length > 0
    ? roomAverages.map(r => ({ name: r.name, value: Math.round((r.avg / maxAvg) * 100) }))
    : [
        { name: 'HVAC Systems', value: 42 },
        { name: 'Lighting', value: 18 },
        { name: 'Lab Equipment', value: 25 },
        { name: 'Computing', value: 15 },
      ];

  return (
    <Card className="border-transparent shadow-sm mb-6">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-[11px] font-bold text-black uppercase tracking-widest">Top Consumers</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-5">
        {consumers.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-black">{item.name}</span>
              <span className="text-xs font-bold text-black">{item.value}%</span>
            </div>
            <Progress 
              value={item.value} 
              indicatorColor="bg-primary-dark" 
              className="h-1.5 bg-[#E2E8F0]" 
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

