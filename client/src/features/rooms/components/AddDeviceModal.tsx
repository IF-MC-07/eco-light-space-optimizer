import React from "react";
import { X, QrCode, MapPin, Info, MonitorSpeaker } from "lucide-react";
import { Button } from "../../../components/ui/Button";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDeviceModal({ isOpen, onClose }: AddDeviceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[480px] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-8 pt-8 pb-6 flex justify-between items-start">
          <div>
            <h2 className="font-heading text-2xl font-bold text-secondary-dark mb-1">Add New Device</h2>
            <p className="text-secondary-light text-sm leading-relaxed max-w-[320px]">
              Integrate a new hardware endpoint into the Arboretum ecosystem. Ensure the serial number matches the manufacturer label.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-secondary-dark hover:text-primary transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 space-y-5">
          {/* Device Name */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Device Name</label>
            <input 
              type="text" 
              placeholder="e.g. Lobby South Chiller"
              className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark placeholder-secondary-light focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Device Type */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Device Type</label>
              <div className="relative">
                <select className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 pl-4 pr-10 py-3.5 appearance-none cursor-pointer">
                  <option value="lighting">Lighting</option>
                  <option value="climate">Climate</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Location/Room</label>
              <div className="relative">
                <select className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 pl-4 pr-10 py-3.5 appearance-none cursor-pointer">
                  <option value="atrium">Atrium</option>
                  <option value="lobby">Lobby</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Serial Number */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Serial Number</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-light placeholder-secondary-light/50 focus:outline-none focus:ring-2 focus:ring-primary/50 pl-4 pr-12 py-3.5"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8492a6] hover:text-primary-dark transition-colors">
                <QrCode className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-[#F8FAFC] rounded-xl p-4 flex space-x-3 mt-4 border border-neutral-border/40">
            <div className="mt-0.5">
              <Info className="w-5 h-5 text-primary-dark" />
            </div>
            <p className="text-xs text-secondary-light leading-relaxed">
              New devices are automatically added to the <strong className="text-secondary-dark">Real-time Flow Monitor</strong>. Baseline energy consumption will be calibrated over the next 24 hours.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-8 bg-white flex items-center justify-end space-x-8 mt-2">
          <button 
            onClick={onClose}
            className="text-sm font-bold text-secondary-dark hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <Button className="bg-primary-dark hover:bg-primary text-white py-3 px-6 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center space-x-2">
            <MonitorSpeaker className="w-5 h-5" />
            <span>Add Device</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
