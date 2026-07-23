import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { useSchedules } from '../hooks';

interface WeeklyScheduleProps {
  onViewFullCalendar?: () => void;
}

const ALL_WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

export function WeeklySchedule({ onViewFullCalendar }: WeeklyScheduleProps) {
  const { data: response } = useSchedules();
  const schedules = response?.data || [];

  // Compute which days have at least one active schedule
  const activeDaySet = new Set<string>();
  for (const s of schedules) {
    const days = s.schedule_days
      ? s.schedule_days.split(',').map((d: string) => d.trim().toUpperCase())
      : ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    days.forEach((d: string) => activeDaySet.add(d));
  }

  const scheduleDays = ALL_WEEK_DAYS.map((day) => ({
    day,
    isActive: activeDaySet.has(day),
  }));

  return (
    <Card className="bg-[#F8FAFC]">
      <CardHeader className="pb-4">
        <CardTitle className="text-[10px] text-secondary font-bold uppercase tracking-wider">Weekly Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          {scheduleDays.map((item, idx) => (
            <div key={idx} className="flex items-center text-xs">
              <span className="w-8 font-bold text-secondary-light">{item.day}</span>
              
              <div className="flex-1 px-4 flex items-center">
                {!item.isActive ? (
                  <div className="w-full border-t-[3px] border-dashed border-tertiary-light opacity-50"></div>
                ) : (
                  <div className="w-full flex items-center gap-2">
                    <div className="h-1.5 w-1/4 bg-primary-dark rounded-full"></div>
                    <div className="h-1.5 w-1/3 bg-[#bbf7d0] rounded-full"></div>
                    <div className="flex-1"></div>
                  </div>
                )}
              </div>
              
              <span className={`w-14 text-right font-bold ${item.isActive ? 'text-primary' : 'text-tertiary'}`}>
                {item.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center">
          <button 
            onClick={onViewFullCalendar}
            className="text-xs font-bold text-primary hover:text-primary-dark transition-colors"
          >
            View Full Calendar
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
