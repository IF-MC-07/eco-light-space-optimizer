"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ChevronDown, Zap, Settings2 } from 'lucide-react';
import { useCreateSchedule } from '../hooks';
import { useRooms } from '../../rooms/hooks';

export function QuickRuleSetup() {
  const [trigger, setTrigger] = useState('Time of day (08:00 AM)');
  const [action, setAction] = useState('Activate Morning Scene');
  const [deploying, setDeploying] = useState(false);
  const [message, setMessage] = useState('');

  const { mutateAsync: createSchedule } = useCreateSchedule();
  const { data: roomsRes } = useRooms();
  const rooms = roomsRes?.data || [];

  const handleDeploy = async () => {
    setDeploying(true);
    setMessage('');
    try {
      const firstRoomId = rooms[0]?.room_id || '';
      await createSchedule({
        schedule_name: `${trigger} -> ${action}`,
        start_time: '08:00:00',
        end_time: '17:00:00',
        room_id: firstRoomId,
      });
      setMessage('Rule deployed successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Failed to deploy rule.');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-neutral-border/50 flex flex-row items-center gap-2">
        <Settings2 className="w-5 h-5 text-primary-dark" />
        <CardTitle className="text-lg font-heading font-black text-black tracking-tight">Quick Setup</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <label className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2.5">Trigger Condition</label>
          <div className="relative group">
            <select 
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="w-full appearance-none bg-[#F1F5F9] border-2 border-transparent rounded-2xl py-4 pl-5 pr-12 text-sm font-bold text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary/20 transition-all cursor-pointer"
            >
              <option value="Time of day (08:00 AM)">Time of day (08:00 AM)</option>
              <option value="Motion detected in Zone">Motion detected in Zone</option>
              <option value="Ambient Light < 20%">Ambient Light &lt; 20%</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none group-hover:text-primary-dark transition-colors">
              <ChevronDown size={18} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2.5">Execute Action</label>
          <div className="relative group">
            <select 
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full appearance-none bg-[#F1F5F9] border-2 border-transparent rounded-2xl py-4 pl-5 pr-12 text-sm font-bold text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary/20 transition-all cursor-pointer"
            >
              <option value="Activate Morning Scene">Activate Morning Scene</option>
              <option value="Turn off HVAC units">Turn off HVAC units</option>
              <option value="Set Dimming to 50%">Set Dimming to 50%</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none group-hover:text-primary-dark transition-colors">
              <ChevronDown size={18} />
            </div>
          </div>
        </div>

        <Button 
          disabled={deploying}
          onClick={handleDeploy}
          className="w-full py-4 rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-3 bg-primary-dark hover:bg-primary transition-all active:scale-95 group"
        >
          <span>{deploying ? 'Deploying...' : 'Deploy Rule'}</span>
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <Zap size={14} className="fill-current" />
          </div>
        </Button>
        
        {message && (
          <p className="text-xs text-center font-bold text-primary-dark tracking-wide animate-pulse">
            {message}
          </p>
        )}

        <p className="text-[10px] text-center text-secondary font-medium tracking-wide">
          Rules will be applied to all <span className="text-primary-dark font-bold underline underline-offset-4 decoration-primary/30">Primary Zones</span>
        </p>
      </CardContent>
    </Card>
  );
}
