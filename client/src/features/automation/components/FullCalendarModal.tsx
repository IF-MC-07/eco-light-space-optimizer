"use client";
import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, RefreshCw, Info } from "lucide-react";
import { cn } from "../../../lib/utils";
import { useHolidays } from "../hooks";
import type { Holiday } from "../types";

interface FullCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FullCalendarModal({ isOpen, onClose }: FullCalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const { data: holidaysRes, isLoading: isLoadingHolidays } = useHolidays(year);
  const holidays = (holidaysRes?.data || []) as Holiday[];

  if (!isOpen) return null;

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getHolidayStyles = (holiday: Holiday) => {
    switch (holiday.type) {
      case 'cuti_bersama':
        return {
          cellBg: 'bg-[#FFFBEB]/60',
          text: 'text-amber-600',
          badge: 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]',
          dot: 'bg-amber-400',
        };
      case 'kampus':
        return {
          cellBg: 'bg-[#EFF6FF]/60',
          text: 'text-blue-600',
          badge: 'bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE]',
          dot: 'bg-blue-400',
        };
      case 'nasional':
      default:
        return {
          cellBg: 'bg-[#FFF1F2]/60',
          text: 'text-[#DC2626]',
          badge: 'bg-[#FFE4E6] text-[#DC2626] border border-[#FECDD3]',
          dot: 'bg-red-400',
        };
    }
  };

  const days = [];
  // Fill empty slots for previous month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-32 border border-neutral-border/30 bg-[#F1F5F9]/30"></div>);
  }

  // Fill actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const holiday = holidays.find(h => h.holiday_date === dateStr);
    const holidayStyles = holiday ? getHolidayStyles(holiday) : null;

    // Real-time "Today" detection
    const now = new Date();
    const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();

    days.push(
      <div key={d} className={cn(
        "h-32 border border-neutral-border/30 p-2 transition-colors hover:bg-neutral relative overflow-hidden",
        holidayStyles ? holidayStyles.cellBg : "bg-white",
        isToday && "ring-2 ring-primary-dark ring-inset"
      )}>
        <div className="flex justify-between items-start mb-2">
          <span className={cn(
            "w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold",
            isToday
              ? "bg-primary-dark text-white shadow-sm"
              : holidayStyles
              ? holidayStyles.text
              : "text-secondary-dark"
          )}>
            {d}
          </span>
          {holiday && holidayStyles && (
            <span
              className={cn(
                "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase leading-tight text-right max-w-[80px] truncate",
                holidayStyles.badge
              )}
              title={`${holiday.name} (${holiday.type})`}
            >
              {holiday.name}
            </span>
          )}
        </div>

        <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
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

          {/* Info banner jika data libur tahun belum diisi */}
          {!isLoadingHolidays && holidays.length === 0 && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-neutral/80 border border-neutral-border rounded-xl text-sm font-semibold text-secondary-dark">
              <Info size={16} className="text-secondary-light flex-shrink-0" />
              <span>Data libur tahun {year} belum diisi</span>
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
        <div className="p-6 bg-[#F8FAFC] border-t border-neutral-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary-dark rounded-full"></div>
              <span className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider">Active Rule</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#FFE4E6] border border-[#FECDD3] rounded-full"></div>
              <span className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider">National Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-full"></div>
              <span className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider">Cuti Bersama</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#DBEAFE] border border-[#BFDBFE] rounded-full"></div>
              <span className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider">Campus Holiday</span>
            </div>
          </div>
          <p className="text-xs text-neutral-body italic">
            * Rules are automatically suspended during holidays.
          </p>
        </div>
      </div>
    </div>
  );
}
