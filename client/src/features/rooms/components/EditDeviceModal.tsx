import React from "react";
import { Share2, Leaf } from "lucide-react";
import { Button } from "../../../components/ui/Button";

interface EditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditDeviceModal({ isOpen, onClose }: EditDeviceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[480px] overflow-hidden flex flex-col p-8 md:p-10 relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-6">
          <h2 className="font-heading text-2xl font-bold text-secondary-dark mb-1">Edit Device Settings</h2>
          <p className="text-secondary-light text-sm">Update operational parameters for the selected hardware.</p>
        </div>

        <div className="space-y-6">
          {/* Device Name */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary-dark">Device Name</label>
            <input 
              type="text" 
              defaultValue="HVAC-Arb-04-A"
              className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary-dark">Category</label>
            <div className="relative">
              <select className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5 appearance-none cursor-pointer">
                <option value="climate">Climate Control</option>
                <option value="lighting">Lighting</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {/* Network ID */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary-dark">Network ID</label>
            <div className="w-full bg-[#F8FAFC] border border-neutral-border/50 rounded-lg flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center space-x-3 text-primary-dark font-bold">
                <Share2 className="w-5 h-5" />
                <span className="text-sm">#SP-NET-9928-VX</span>
              </div>
              <span className="text-[10px] font-bold text-secondary-dark uppercase tracking-widest bg-secondary-light/20 px-2.5 py-1 rounded">
                SYSTEM-LOCKED
              </span>
            </div>
          </div>

          {/* Energy Compliance Box */}
          <div className="bg-[#F0FDF4]/50 border border-[#bbf7d0] rounded-xl p-4 flex space-x-3 mt-4">
            <div className="mt-0.5">
              <Leaf className="w-5 h-5 text-primary-dark" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-primary-dark mb-1">Energy Compliance</h4>
              <p className="text-xs text-secondary-dark leading-relaxed">
                This device is currently contributing to a 12% reduction in regional energy waste.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-6 mt-10">
          <button 
            onClick={onClose}
            className="text-sm font-bold text-secondary-dark hover:text-primary transition-colors"
          >
            Discard Changes
          </button>
          <Button className="bg-primary-dark hover:bg-primary text-white py-3 px-6 rounded-lg text-sm font-semibold transition-colors shadow-sm">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
