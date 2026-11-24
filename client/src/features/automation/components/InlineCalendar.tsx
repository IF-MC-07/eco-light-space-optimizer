"use client";
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, RefreshCw, Loader2, Info } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useCreateSchedule, useSchedules, useHolidays } from '../hooks';
import { useRooms } from '../../rooms/hooks';
import type { Holiday } from '../types';

interface NewScheduleForm {
  name: string;
  startTime: string;
  endTime: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function InlineCalendar() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewScheduleForm>({ name: '', startTime: '06:00', endTime: '23:00' });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();

  const { data: holidaysRes, isLoading: isLoadingHolidays } = useHolidays(year);
  const holidays = (holidaysRes?.data || []) as Holiday[];

  const { mutateAsync: createSchedule } = useCreateSchedule();
  const { data: schedulesRes } = useSchedules();
  const { data: roomsRes } = useRooms();
  const schedules = schedulesRes?.data || [];
  const rooms = (roomsRes?.data || []) as any[];

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToToday = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sunday

  const getDateStr = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const getHoliday = (dateStr: string) =>
    holidays.find((h) => h.holiday_date === dateStr);

  const getHolidayStyles = (holiday: Holiday) => {
    switch (holiday.type) {
      case 'cuti_bersama':
        return {
          cellBg: 'bg-amber-50/60',
          text: 'text-amber-600',
          dot: 'bg-amber-400',
          badgeBg: 'bg-amber-50 border-amber-200 text-amber-700',
        };
      case 'kampus':
        return {
          cellBg: 'bg-blue-50/60',
          text: 'text-blue-600',
          dot: 'bg-blue-400',
          badgeBg: 'bg-blue-50 border-blue-200 text-blue-700',
        };
      case 'nasional':
      default:
        return {
          cellBg: 'bg-red-50/60',
          text: 'text-red-600',
          dot: 'bg-red-400',
          badgeBg: 'bg-red-50 border-red-200 text-red-700',
        };
    }
  };

  const getSchedulesForDate = (dateStr: string) => {
    const dow = new Date(dateStr).getDay();
    const dowStr = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dow];
    return (schedules as any[]).filter((s: any) => {
      return s.schedule_name && s.schedule_name.includes(`[`) && s.schedule_name.includes(dowStr);
    });
  };

  const handleDayClick = (d: number) => {
    const ds = getDateStr(d);
    setSelectedDate(ds);
    setShowForm(false);
    setMessage('');
    setForm({ name: '', startTime: '06:00', endTime: '23:00' });
  };

  const handleCreateSchedule = async () => {
    if (!form.name.trim()) {
      setMessage('Schedule name is required.');
      return;
    }
    if (!selectedDate) return;
    setSubmitting(true);
    setMessage('');
    try {
      const firstRoomId = rooms[0]?.room_id || '';
      const dow = new Date(selectedDate).getDay();
      const dowStr = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dow];
      await createSchedule({
        schedule_name: `${form.name.trim()} [${dowStr}]`,
        start_time: `${form.startTime}:00`,
        end_time: `${form.endTime}:00`,
        room_id: firstRoomId,
      });
      setMessage('Schedule created!');
      setShowForm(false);
      setForm({ name: '', startTime: '06:00', endTime: '23:00' });
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('Failed to create schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  // Build calendar cells
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-secondary uppercase tracking-wider">
          Schedule Calendar
        </h2>
        <div className="flex items-center gap-2">
          {isLoadingHolidays && <Loader2 size={12} className="animate-spin text-secondary-light" />}
          <button
            onClick={goToToday}
            className="text-[10px] font-black text-secondary-dark px-3 py-1.5 bg-neutral rounded-lg border border-neutral-border hover:bg-white transition-colors flex items-center gap-1"
          >
            <RefreshCw size={10} />
            Today
          </button>
          <div className="flex items-center bg-neutral border border-neutral-border rounded-lg overflow-hidden">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white transition-colors">
              <ChevronLeft size={14} className="text-secondary-dark" />
            </button>
            <span className="px-3 text-[11px] font-black text-secondary-dark">
              {MONTH_NAMES[month]} {year}
            </span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white transition-colors">
              <ChevronRight size={14} className="text-secondary-dark" />
            </button>
          </div>
        </div>
      </div>

      {/* Info banner jika data libur tahun ini belum diisi */}
      {!isLoadingHolidays && holidays.length === 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-neutral/80 border border-neutral-border rounded-xl text-xs font-semibold text-secondary-dark">
          <Info size={14} className="text-secondary-light flex-shrink-0" />
          <span>Holiday data for {year} has not been configured</span>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-neutral-border/60 overflow-hidden shadow-sm">
        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-neutral-border/40">
          {DAY_LABELS.map((dl, i) => (
            <div
              key={dl}
              className={cn(
                'py-2.5 text-center text-[9px] font-black uppercase tracking-widest',
                i === 0 || i === 6 ? 'text-red-400' : 'text-secondary-light',
              )}
            >
              {dl}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {cells.map((d, idx) => {
            if (d === null) {
              return <div key={`empty-${idx}`} className="h-20 bg-[#FAFAFA] border-r border-b border-neutral-border/20" />;
            }
            const ds = getDateStr(d);
            const holiday = getHoliday(ds);
            const holidayStyles = holiday ? getHolidayStyles(holiday) : null;
            const daySchedules = getSchedulesForDate(ds);
            const isToday =
              d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = selectedDate === ds;
            const isWeekend = idx % 7 === 0 || idx % 7 === 6;
            const isPast = new Date(ds) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <div
                key={d}
                onClick={() => handleDayClick(d)}
                className={cn(
                  'h-20 border-r border-b border-neutral-border/20 p-1.5 cursor-pointer transition-all relative overflow-hidden group',
                  holidayStyles ? holidayStyles.cellBg : isWeekend ? 'bg-[#FAFAFA]' : 'bg-white',
                  isSelected && 'ring-2 ring-inset ring-primary-dark',
                  isPast && !isToday && 'opacity-55',
                  'hover:bg-primary-dark/5',
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <span
                    className={cn(
                      'w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-black',
                      isToday
                        ? 'bg-primary-dark text-white'
                        : holidayStyles
                        ? holidayStyles.text
                        : isWeekend
                        ? 'text-red-400'
                        : 'text-secondary-dark',
                    )}
                  >
                    {d}
                  </span>
                  {holiday && holidayStyles && (
                    <div
                      className={cn('w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0', holidayStyles.dot)}
                      title={`${holiday.name} (${holiday.type})`}
                    />
                  )}
                </div>

                {/* Schedule pills */}
                <div className="space-y-0.5 overflow-hidden max-h-[32px]">
                  {daySchedules.slice(0, 2).map((s: any, i: number) => (
                    <div
                      key={i}
                      className="text-[8px] font-bold text-white bg-primary-dark rounded px-1 py-0.5 truncate"
                    >
                      {s.schedule_name?.split(' [')[0] || s.schedule_name}
                    </div>
                  ))}
                  {daySchedules.length > 2 && (
                    <div className="text-[8px] font-bold text-secondary-light">+{daySchedules.length - 2} more</div>
                  )}
                </div>

                {/* Add button (shown on hover) */}
                {!holiday && !isPast && (
                  <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={10} className="text-primary-dark" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[9px] font-bold text-secondary-light uppercase tracking-widest">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary-dark" />
          Today / Schedule
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          National Holiday
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          Cuti Bersama
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-400" />
          Campus Holiday
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-neutral border border-neutral-border" />
          Weekend
        </div>
      </div>

      {/* Selected Date Panel */}
      {selectedDate && (
        <div className="bg-white rounded-2xl border border-neutral-border/60 shadow-sm overflow-hidden">
          {/* Panel Header */}
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-neutral-border/40">
            <div>
              <p className="text-[10px] font-black text-secondary-light uppercase tracking-widest">Selected</p>
              <p className="text-sm font-black text-secondary-dark">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black bg-primary-dark text-white hover:bg-primary transition-colors"
                >
                  <Plus size={12} />
                  Add Schedule
                </button>
              )}
              <button onClick={() => { setSelectedDate(null); setShowForm(false); }}>
                <X size={16} className="text-secondary-light hover:text-secondary-dark" />
              </button>
            </div>
          </div>

          {/* Existing schedules for day */}
          {(() => {
            const ds = getSchedulesForDate(selectedDate);
            const holiday = getHoliday(selectedDate);
            const holidayStyles = holiday ? getHolidayStyles(holiday) : null;
            return (
              <div className="px-5 py-3 space-y-2">
                {holiday && holidayStyles && (
                  <div className={cn('flex items-center gap-2 p-2 border rounded-xl', holidayStyles.badgeBg)}>
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', holidayStyles.dot)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold">{holiday.name}</p>
                      <p className="text-[9px] uppercase tracking-wider opacity-75">{holiday.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                )}
                {ds.length === 0 && !showForm && (
                  <p className="text-[11px] text-secondary-light py-2 text-center">No schedules. Click "Add Schedule" to create one.</p>
                )}
                {ds.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-[#F1F5F9] rounded-xl">
                    <Clock size={12} className="text-primary-dark flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-secondary-dark truncate">
                        {s.schedule_name?.split(' [')[0]}
                      </p>
                      <p className="text-[9px] text-secondary">
                        {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}
                      </p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-primary-dark flex-shrink-0" />
                  </div>
                ))}

                {/* Create Form */}
                {showForm && (
                  <div className="mt-2 p-3.5 bg-neutral/60 rounded-xl border border-neutral-border/60 space-y-3">
                    <p className="text-[10px] font-black text-secondary-light uppercase tracking-widest">New Schedule</p>
                    <input
                      type="text"
                      placeholder="Schedule name (e.g. Morning Class)"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-neutral-border bg-white focus:outline-none focus:ring-2 focus:ring-primary-dark/30"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-black text-secondary-light uppercase tracking-widest block mb-1">Start</label>
                        <input
                          type="time"
                          value={form.startTime}
                          onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                          className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-neutral-border bg-white focus:outline-none focus:ring-2 focus:ring-primary-dark/30"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-secondary-light uppercase tracking-widest block mb-1">End</label>
                        <input
                          type="time"
                          value={form.endTime}
                          onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                          className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-neutral-border bg-white focus:outline-none focus:ring-2 focus:ring-primary-dark/30"
                        />
                      </div>
                    </div>
                    {message && (
                      <p className={`text-[10px] font-bold ${message.includes('created') ? 'text-primary-dark' : 'text-red-600'}`}>
                        {message}
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => { setShowForm(false); setMessage(''); }}
                        className="px-3 py-1.5 text-[11px] font-bold text-secondary border border-neutral-border rounded-xl hover:bg-neutral transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateSchedule}
                        disabled={submitting}
                        className="px-4 py-1.5 text-[11px] font-black bg-primary-dark text-white rounded-xl hover:bg-primary transition-colors disabled:opacity-50"
                      >
                        {submitting ? 'Creating...' : 'Create Schedule'}
                      </button>
                    </div>
                  </div>
                )}
                {!showForm && message && (
                  <p className="text-[10px] font-bold text-primary-dark">{message}</p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
