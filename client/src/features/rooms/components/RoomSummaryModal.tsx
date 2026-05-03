import React from "react";
import { X, Thermometer, Users, Leaf, Wind, Lightbulb, Radio, ArrowRight } from "lucide-react";
import { Button } from "../../../components/ui/Button";

interface RoomSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName?: string;
  roomType?: string;
  roomLocation?: string;
}

export function RoomSummaryModal({
  isOpen,
  onClose,
  roomName = "Room 606",
  roomType = "Executive Suite",
  roomLocation = "East Wing"
}: RoomSummaryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[480px] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 flex justify-between items-start">
          <div>
            <h2 className="font-heading text-2xl font-bold text-secondary-dark">{roomName} Summary</h2>
            <p className="text-secondary-light text-sm mt-1">
              {roomType} • {roomLocation}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-secondary-light hover:text-secondary-dark transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Stats */}
        <div className="px-8 flex justify-between gap-4 mb-8">
          <div className="flex-1 bg-[#F5F7F5] rounded-xl p-4 flex flex-col justify-between">
            <Thermometer className="w-5 h-5 text-primary-dark mb-3" />
            <div>
              <p className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider mb-1">Current Temp</p>
              <p className="font-heading text-xl font-bold text-secondary-dark">23.5°C</p>
            </div>
          </div>
          <div className="flex-1 bg-[#F5F7F5] rounded-xl p-4 flex flex-col justify-between">
            <Users className="w-5 h-5 text-primary-dark mb-3" />
            <div>
              <p className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider mb-1">Occupancy</p>
              <p className="font-heading text-xl font-bold text-secondary-dark">High</p>
            </div>
          </div>
          <div className="flex-1 bg-[#F5F7F5] rounded-xl p-4 flex flex-col justify-between">
            <Leaf className="w-5 h-5 text-primary-dark mb-3" />
            <div>
              <p className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider mb-1">Energy Mode</p>
              <p className="font-heading text-xl font-bold text-secondary-dark">Eco</p>
            </div>
          </div>
        </div>

        {/* Active Devices List */}
        <div className="px-8 mb-6">
          <h3 className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest mb-4">Active Devices</h3>
          <div className="space-y-6">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-[#86EFAC] flex items-center justify-center text-primary-dark">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-secondary-dark">Climate Control</h4>
                  <p className="text-xs text-secondary-light">Optimizing airflow</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="text-xs font-semibold text-primary-dark">Running</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-[#86EFAC] flex items-center justify-center text-primary-dark">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-secondary-dark">Smart Lighting</h4>
                  <p className="text-xs text-secondary-light">Dimmed to 40%</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="text-xs font-semibold text-primary-dark">Running</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-[#E2E8F0] flex items-center justify-center text-secondary-dark">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-secondary-dark">CO2 Sensor</h4>
                  <p className="text-xs text-secondary-light">Monitoring quality</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#CBD5E1]"></span>
                <span className="text-xs font-semibold text-secondary-light">Standby</span>
              </div>
            </div>

          </div>
        </div>

        {/* Efficiency Score */}
        <div className="px-8 mb-6">
          <div className="bg-[#F5F7F5] rounded-xl p-4 flex items-center space-x-4">
            <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white border-4 border-primary-dark">
              <span className="text-xs font-bold text-secondary-dark">82%</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-secondary-dark">Efficiency Score</h4>
              <p className="text-xs text-secondary-light">Performing above building average</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 pb-8 pt-4 bg-white flex flex-col items-center space-y-4">
          <Button className="w-full bg-primary-dark hover:bg-primary text-white py-6 rounded-xl flex items-center justify-center space-x-2 text-sm font-semibold transition-colors">
            <span>Go to Room Management</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <button className="text-sm font-semibold text-secondary-dark hover:text-primary transition-colors">
            Download Room Log
          </button>
        </div>
      </div>
    </div>
  );
}
