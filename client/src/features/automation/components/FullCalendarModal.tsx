import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Bell, Calendar as CalendarIcon, Loader2, RefreshCw } from "lucide-react";
import { cn } from "../../../lib/utils";

interface FullCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Holiday {
  holiday_date: string;
  holiday_name: string;
  is_national_holiday: boolean;
}

const MOCK_EVENTS = [
  { date: "2024-05-14", title: "Morning Ambience", time: "07:00 AM" },
  { date: "2024-05-14", title: "Night Mode", time: "10:00 PM" },
  { date: "2024-05-15", title: "Hallway Auto-Off", time: "All Day" },
  { date: "2024-05-18", title: "Peak Hour Saver", time: "01:00 PM" },
];

export function FullCalendarModal({ isOpen, onClose }: FullCalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date()); // Use real current date (2026)
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchHolidays = async () => {
        setIsLoadingHolidays(true);
        try {
          // Attempting to fetch from the public API
          const yearToFetch = currentDate.getFullYear();
          const response = await fetch(`https://api-harilibur.vercel.app/api?year=${yearToFetch}`, {
            method: 'GET',
            mode: 'cors',
          });
          
          if (!response.ok) throw new Error("API Offline");
          
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setHolidays(data);
          } else {
            throw new Error("Invalid Data");
          }
        } catch (error) {
          console.warn("Holiday API unreachable, using system fallback for 2026.");
          // Comprehensive 2026 Indonesian Holiday Fallback
          setHolidays([
            { holiday_date: "2026-01-01", holiday_name: "Tahun Baru 2026 Masehi", is_national_holiday: true },
            { holiday_date: "2026-01-19", holiday_name: "Isra Mi'raj Nabi Muhammad SAW", is_national_holiday: true },
            { holiday_date: "2026-02-17", holiday_name: "Tahun Baru Imlek 2577 Kongzili", is_national_holiday: true },
            { holiday_date: "2026-03-20", holiday_name: "Hari Suci Nyepi Tahun Baru Saka 1948", is_national_holiday: true },
            { holiday_date: "2026-03-20", holiday_name: "Hari Raya Idul Fitri 1447 Hijriah", is_national_holiday: true },
            { holiday_date: "2026-03-21", holiday_name: "Hari Raya Idul Fitri 1447 Hijriah", is_national_holiday: true },
            { holiday_date: "2026-04-03", holiday_name: "Wafat Yesus Kristus", is_national_holiday: true },
            { holiday_date: "2026-04-05", holiday_name: "Hari Paskah", is_national_holiday: true },
            { holiday_date: "2026-05-01", holiday_name: "Hari Buruh Internasional", is_national_holiday: true },
            { holiday_date: "2026-05-14", holiday_name: "Kenaikan Yesus Kristus", is_national_holiday: true },
            { holiday_date: "2026-05-31", holiday_name: "Hari Raya Waisak 2570 BE", is_national_holiday: true },
            { holiday_date: "2026-06-01", holiday_name: "Hari Lahir Pancasila", is_national_holiday: true },
            { holiday_date: "2026-06-27", holiday_name: "Hari Raya Idul Adha 1447 Hijriah", is_national_holiday: true },
            { holiday_date: "2026-07-17", holiday_name: "Tahun Baru Islam 1448 Hijriah", is_national_holiday: true },
            { holiday_date: "2026-08-17", holiday_name: "Hari Kemerdekaan Republik Indonesia", is_national_holiday: true },
            { holiday_date: "2026-09-25", holiday_name: "Maulid Nabi Muhammad SAW", is_national_holiday: true },
            { holiday_date: "2026-12-25", holiday_name: "Hari Raya Natal", is_national_holiday: true },
          ]);
        } finally {
          setIsLoadingHolidays(false);
        }
      };
      fetchHolidays();
    }
  }, [isOpen, currentDate]);

  if (!isOpen) return null;

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  // Fill empty slots for previous month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-32 border border-neutral-border/30 bg-[#F1F5F9]/30"></div>);
  }

  // Fill actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const holiday = holidays.find(h => h.holiday_date === dateStr);
    const events = MOCK_EVENTS.filter(e => e.date === dateStr);
    
    // Real-time "Today" detection
    const now = new Date();
    const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();

    days.push(
      <div key={d} className={cn(
        "h-32 border border-neutral-border/30 p-2 transition-colors hover:bg-neutral relative overflow-hidden",
        holiday ? "bg-[#FFF1F2]/50" : "bg-white",
        isToday && "ring-2 ring-primary-dark ring-inset"
      )}>
        <div className="flex justify-between items-start mb-2">
          <span className={cn(
            "w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold",
            isToday ? "bg-primary-dark text-white shadow-sm" : holiday ? "text-[#DC2626]" : "text-secondary-dark"
          )}>
            {d}
          </span>
          {holiday && (
            <span className="text-[8px] font-bold text-[#DC2626] bg-[#FFE4E6] px-1 py-0.5 rounded uppercase leading-tight text-right max-w-[60px]">
              {holiday.holiday_name}
            </span>
          )}
        </div>

        <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
          {events.map((event, idx) => (
            <div key={idx} className="text-[9px] bg-primary-dark text-white p-1 rounded font-medium truncate flex items-center gap-1">
              <span className="w-1 h-1 bg-[#86EFAC] rounded-full"></span>
              {event.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div 
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-8 flex items-center justify-between border-b border-neutral-border">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-[#F1F5F9] rounded-2xl flex items-center justify-center text-secondary-dark">
              {isLoadingHolidays ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary-dark" />
              ) : (
                <CalendarIcon className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-secondary-dark tracking-tight">System Automation Calendar</h2>
              <p className="text-sm text-secondary-light">Viewing automation rules & national holidays</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-white border border-neutral-border rounded-xl text-xs font-bold text-secondary-dark hover:bg-neutral transition-all shadow-sm flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Today
            </button>
            <div className="flex items-center bg-[#F1F5F9] rounded-xl p-1">
              <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronLeft className="w-5 h-5" /></button>
              <span className="px-6 font-bold text-secondary-dark min-w-[150px] text-center">
                {monthNames[month]} {year}
              </span>
              <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-secondary-dark hover:bg-tertiary/10 hover:text-tertiary transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {isLoadingHolidays && holidays.length === 0 && (
            <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary-dark" />
                <p className="text-sm font-bold text-secondary-dark uppercase tracking-widest">Syncing Calendar...</p>
              </div>
            </div>
          )}
          {/* Day Names */}
          <div className="grid grid-cols-7 gap-0 border-x border-t border-neutral-border/30 rounded-t-xl overflow-hidden">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day, idx) => (
              <div key={day} className={cn(
                "py-4 text-center text-[10px] font-bold tracking-widest text-secondary-light uppercase bg-[#F8FAFC] border-b border-neutral-border/30",
                (idx === 0 || idx === 6) && "text-[#DC2626]/60"
              )}>
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-0 border-l border-neutral-border/30 rounded-b-xl overflow-hidden">
            {days}
          </div>
        </div>

        {/* Legend Footer */}
        <div className="p-6 bg-[#F8FAFC] border-t border-neutral-border flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary-dark rounded-full"></div>
              <span className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider">Active Rule</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#FFE4E6] border border-[#FECDD3] rounded-full"></div>
              <span className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider">National Holiday (ID)</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-secondary-light">
            <Bell className="w-4 h-4" />
            Rules are automatically suspended during holidays unless overridden.
          </div>
        </div>
      </div>
    </div>
  );
}
