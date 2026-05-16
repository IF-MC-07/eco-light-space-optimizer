"use client";
import React, { useState, useEffect } from "react";
import { X, Clock, RefreshCw, Plus } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Switch } from "../../../components/ui/Switch";
import { cn } from "../../../lib/utils";
import { useSchedules, useUpdateSchedule, useToggleSchedule, useCreateSchedule } from "../hooks";
import { DayOfWeek } from "../types";

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId?: string;
  isAddingNew?: boolean; // New prop to indicate "Add" mode
}

export function EditScheduleModal({ isOpen, onClose, deviceId, isAddingNew = false }: EditScheduleModalProps) {
  const { data: scheduleData, isLoading } = useSchedules(deviceId || "");
  const { mutate: updateSchedule, isPending: isUpdating } = useUpdateSchedule();
  const { mutate: createSchedule, isPending: isCreating } = useCreateSchedule();
  const { mutate: toggleSchedule, isPending: isToggling } = useToggleSchedule();

  const schedule = !isAddingNew ? scheduleData?.data?.[0] : null;

  const [name, setName] = useState("Daily Schedule");
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("18:00");
  const [activeDays, setActiveDays] = useState<DayOfWeek[]>([]);

  useEffect(() => {
    if (schedule && !isAddingNew) {
      setName(schedule.name || "Daily Schedule");
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
      setActiveDays(schedule.days);
    } else if (isAddingNew) {
      // Reset to defaults for new schedule
      setName("New Automation Rule");
      setStartTime("08:00");
      setEndTime("17:00");
      setActiveDays([DayOfWeek.MON, DayOfWeek.TUE, DayOfWeek.WED, DayOfWeek.THU, DayOfWeek.FRI]);
    }
  }, [schedule, isAddingNew, isOpen]);

  if (!isOpen || !deviceId) return null;

  const allDays = [
    { label: "M", value: DayOfWeek.MON },
    { label: "T", value: DayOfWeek.TUE },
    { label: "W", value: DayOfWeek.WED },
    { label: "T", value: DayOfWeek.THU },
    { label: "F", value: DayOfWeek.FRI },
    { label: "S", value: DayOfWeek.SAT },
    { label: "S", value: DayOfWeek.SUN },
  ];

  const handleDayToggle = (day: DayOfWeek) => {
    if (activeDays.includes(day)) {
      setActiveDays(activeDays.filter(d => d !== day));
    } else {
      setActiveDays([...activeDays, day]);
    }
  };

  const handleSave = () => {
    if (isAddingNew) {
      createSchedule(
        { deviceId, name, startTime, endTime, days: activeDays, isActive: true },
        { onSuccess: () => onClose() }
      );
    } else if (schedule) {
      updateSchedule(
        { id: schedule.id, payload: { name, startTime, endTime, days: activeDays } },
        { onSuccess: () => onClose() }
      );
    }
  };

  const handleToggleActive = () => {
    if (!schedule) return;
    toggleSchedule(schedule.id);
  };

  const isSaving = isUpdating || isCreating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[440px] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {isLoading && !isAddingNew ? (
          <div className="p-10 text-center text-secondary-light">Loading schedule...</div>
        ) : (
          <>
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-primary-dark uppercase tracking-widest bg-[#D1FAE5] px-3 py-1.5 rounded-full">
                  {isAddingNew ? "New Automation" : "Automation Detail"}
                </span>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-secondary-dark hover:bg-[#E2E8F0] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-2xl font-bold text-secondary-dark">
                  {isAddingNew ? "Add Schedule" : "Edit Schedule"}
                </h2>
                {!isAddingNew && schedule && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-secondary-light uppercase">Active</span>
                    <Switch 
                      checked={schedule.isActive}
                      onCheckedChange={handleToggleActive}
                      disabled={isToggling}
                    />
                  </div>
                )}
              </div>

              {/* Schedule Name */}
              <div className="space-y-2 mb-6">
                <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Schedule Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. Morning Ambience"
                  className="w-full bg-[#F1F5F9] border-none rounded-xl text-base font-semibold text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5"
                />
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Start Time</label>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-[#F1F5F9] border-none rounded-xl text-base font-semibold text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 pl-4 pr-10 py-3.5"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">End Time</label>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-[#F1F5F9] border-none rounded-xl text-base font-semibold text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 pl-4 pr-10 py-3.5"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Days Active */}
              <div className="mb-6">
                <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest block mb-4">Days Active</label>
                <div className="flex justify-between items-center gap-2">
                  {allDays.map((day, i) => {
                    const isActive = activeDays.includes(day.value);
                    return (
                      <button
                        key={i}
                        onClick={() => handleDayToggle(day.value)}
                        className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold transition-colors shadow-sm",
                          isActive 
                            ? "bg-primary-dark text-white hover:bg-primary" 
                            : "bg-[#E2E8F0] text-secondary-dark hover:bg-[#CBD5E1]"
                        )}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-8 pb-8 bg-[#F8FAFC] flex flex-col items-center pt-8 border-t border-neutral-border/50">
              <Button 
                onClick={handleSave}
                disabled={isSaving || (!isAddingNew && !schedule)}
                className="w-full bg-primary-dark hover:bg-primary text-white py-4 rounded-xl text-base font-semibold transition-colors shadow-sm mb-4 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : isAddingNew ? "Create Schedule" : "Update Schedule"}
              </Button>
              <button 
                onClick={onClose}
                disabled={isSaving}
                className="text-sm font-bold text-secondary-dark hover:text-primary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
