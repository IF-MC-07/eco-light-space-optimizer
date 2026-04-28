import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';

export function WeeklySchedule() {
  const scheduleDays = [
    { day: 'MON', status: 'Active', isHoliday: false },
    { day: 'TUE', status: 'Active', isHoliday: false },
    { day: 'WED', status: 'Active', isHoliday: false },
    { day: 'THU', status: 'Holiday', isHoliday: true },
    { day: 'FRI', status: 'Active', isHoliday: false },
  ];

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
                {item.isHoliday ? (
                  <div className="w-full border-t-[3px] border-dashed border-tertiary-light opacity-50"></div>
                ) : (
                  <div className="w-full flex items-center gap-2">
                    <div className="h-1.5 w-1/4 bg-primary-dark rounded-full"></div>
                    <div className="h-1.5 w-1/3 bg-[#bbf7d0] rounded-full"></div>
                    <div className="flex-1"></div>
                  </div>
                )}
              </div>
              
              <span className={`w-12 text-right font-bold ${item.isHoliday ? 'text-tertiary' : 'text-primary'}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center">
          <a href="#" className="text-xs font-bold text-primary hover:text-primary-dark transition-colors">
            View Full Calendar
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
