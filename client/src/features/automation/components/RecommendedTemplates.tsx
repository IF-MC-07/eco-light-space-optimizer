"use client";
import React, { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Moon, Briefcase } from 'lucide-react';
import { useCreateSchedule } from '../hooks';
import { useRooms } from '../../rooms/hooks';

export function RecommendedTemplates() {
  const { mutateAsync: createSchedule } = useCreateSchedule();
  const { data: roomsRes } = useRooms();
  const rooms = roomsRes?.data || [];
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const handleDeployTemplate = async (templateName: string, startTime: string, endTime: string) => {
    setLoading(templateName);
    setMessage('');
    try {
      const firstRoomId = rooms[0]?.room_id || '';
      await createSchedule({
        schedule_name: templateName,
        start_time: startTime,
        end_time: endTime,
        room_id: firstRoomId,
      });
      setMessage(`Template "${templateName}" deployed!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Failed to deploy template.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">Recommended Templates</h2>
        {message && <span className="text-xs font-bold text-primary-dark tracking-wide animate-pulse">{message}</span>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* Sleep Deep Routine */}
        <Card 
          onClick={() => !loading && handleDeployTemplate('Sleep Deep Routine', '22:00:00', '06:00:00')}
          className={`bg-[#F1F5F9] border-transparent hover:border-neutral-border cursor-pointer transition-colors ${loading === 'Sleep Deep Routine' ? 'opacity-50' : ''}`}
        >
          <CardContent className="p-4 flex flex-col gap-3 mt-5">
            <div className="flex items-center gap-3">
              <Moon size={18} className="text-black" />
              <h3 className="text-sm font-bold text-black">
                {loading === 'Sleep Deep Routine' ? 'Deploying...' : 'Sleep Deep Routine'}
              </h3>
            </div>
            <p className="text-xs text-secondary-dark leading-relaxed">
              Gradually dims lights and lowers AC over 30 minutes.
            </p>
          </CardContent>
        </Card>

        {/* Away Mode Eco */}
        <Card 
          onClick={() => !loading && handleDeployTemplate('Away Mode Eco', '08:00:00', '17:00:00')}
          className={`bg-[#F1F5F9] border-transparent hover:border-neutral-border cursor-pointer transition-colors ${loading === 'Away Mode Eco' ? 'opacity-50' : ''}`}
        >
          <CardContent className="p-4 flex flex-col gap-3 mt-5">
            <div className="flex items-center gap-3">
              <Briefcase size={18} className="text-black" />
              <h3 className="text-sm font-bold text-black">
                {loading === 'Away Mode Eco' ? 'Deploying...' : 'Away Mode Eco'}
              </h3>
            </div>
            <p className="text-xs text-secondary-dark leading-relaxed">
              Kill-switch for all non-essential devices when leaving.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
