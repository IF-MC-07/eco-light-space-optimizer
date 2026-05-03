import React from "react";
import { X, Clock, RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/utils";

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditScheduleModal({ isOpen, onClose }: EditScheduleModalProps) {
  if (!isOpen) return null;

  const days = [
    { label: "M", active: true },
    { label: "T", active: true },
    { label: "W", active: true },
    { label: "T", active: true },
    { label: "F", active: true },
    { label: "S", active: false },
    { label: "S", active: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[440px] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-primary-dark uppercase tracking-widest bg-[#D1FAE5] px-3 py-1.5 rounded-full">
              Automation Detail
            </span>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-secondary-dark hover:bg-[#E2E8F0] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 className="font-heading text-2xl font-bold text-secondary-dark mb-8">Edit Schedule: Morning Warmup</h2>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Start Time</label>
              <div className="relative">
                <input 
                  type="text" 
                  defaultValue="06:00 AM"
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
                  type="text" 
                  defaultValue="09:00 AM"
                  className="w-full bg-[#F1F5F9] border-none rounded-xl text-base font-semibold text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 pl-4 pr-10 py-3.5"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                  <RefreshCw className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Target Temperature Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Target Temperature</label>
              <span className="font-heading text-3xl font-bold text-primary-dark leading-none">23.5°C</span>
            </div>
            
            <div className="relative w-full h-4 mt-2">
              <div className="absolute inset-0 bg-[#E2E8F0] rounded-full h-3 top-1/2 -translate-y-1/2"></div>
              <div className="absolute left-0 w-[60%] bg-primary-dark rounded-full h-3 top-1/2 -translate-y-1/2"></div>
              <div className="absolute left-[60%] -translate-x-1/2 w-6 h-6 bg-white border-4 border-primary-dark rounded-full shadow-sm top-1/2 -translate-y-1/2"></div>
            </div>
            <div className="flex justify-between text-xs font-bold text-secondary-light mt-3">
              <span>16°C</span>
              <span>28°C</span>
            </div>
          </div>

          {/* Days Active */}
          <div className="mb-6">
            <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest block mb-4">Days Active</label>
            <div className="flex justify-between items-center gap-2">
              {days.map((day, i) => (
                <button
                  key={i}
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold transition-colors shadow-sm",
                    day.active 
                      ? "bg-primary-dark text-white hover:bg-primary" 
                      : "bg-[#E2E8F0] text-secondary-dark hover:bg-[#CBD5E1]"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 pb-8 bg-[#F8FAFC] flex flex-col items-center pt-8 border-t border-neutral-border/50">
          <Button className="w-full bg-primary-dark hover:bg-primary text-white py-4 rounded-xl text-base font-semibold transition-colors shadow-sm mb-4">
            Update Schedule
          </Button>
          <button 
            onClick={onClose}
            className="text-sm font-bold text-secondary-dark hover:text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
