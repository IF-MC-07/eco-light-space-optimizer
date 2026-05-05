"use client";
import React from "react";
import { X, Thermometer, Users, Leaf, Wind, Lightbulb, Radio, ArrowRight, Video, MonitorOff } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { RoleGuard } from "../../../components/auth/RoleGuard";
import { useRouter } from "next/navigation";

interface RoomSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: any;
}

export function RoomSummaryModal({
  isOpen,
  onClose,
  room
}: RoomSummaryModalProps) {
  const router = useRouter();

  if (!isOpen || !room) return null;

  const devices = room.devices || [];

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "Light": return <Lightbulb className="w-5 h-5" />;
      case "Sensor": return <Radio className="w-5 h-5" />;
      case "Camera": return <Video className="w-5 h-5" />;
      case "AC": return <Wind className="w-5 h-5" />;
      default: return <MonitorOff className="w-5 h-5" />;
    }
  };

  const getDeviceColor = (type: string) => {
    switch (type) {
      case "Light": return "bg-[#86EFAC] text-primary-dark";
      case "AC": return "bg-[#86EFAC] text-primary-dark";
      default: return "bg-[#E2E8F0] text-secondary-dark";
    }
  };

  const activeDevices = devices.filter((d: any) => d.status === "Running" || d.status === "ONLINE").length;
  const efficiency = room.efficiencyScore || (devices.length ? Math.round((activeDevices / devices.length) * 100) : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[480px] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <>
          {/* Header */}
          <div className="px-8 pt-8 pb-6 flex justify-between items-start shrink-0">
            <div>
              <h2 className="font-heading text-2xl font-bold text-secondary-dark">{room.name} Summary</h2>
              <p className="text-secondary-light text-sm mt-1">
                {room.building} • {room.floor}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-secondary-light hover:text-secondary-dark transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto overflow-x-hidden flex-1">
            {/* Top Stats */}
            <div className="px-8 flex justify-between gap-4 mb-8">
              <div className="flex-1 bg-[#F5F7F5] rounded-xl p-4 flex flex-col justify-between">
                <Thermometer className="w-5 h-5 text-primary-dark mb-3" />
                <div>
                  <p className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider mb-1">Status</p>
                  <p className="font-heading text-xl font-bold text-secondary-dark">{room.status || "ACTIVE"}</p>
                </div>
              </div>
              <div className="flex-1 bg-[#F5F7F5] rounded-xl p-4 flex flex-col justify-between">
                <Users className="w-5 h-5 text-primary-dark mb-3" />
                <div>
                  <p className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider mb-1">Occupancy</p>
                  <p className="font-heading text-xl font-bold text-secondary-dark">{room.occupancy}</p>
                </div>
              </div>
              <div className="flex-1 bg-[#F5F7F5] rounded-xl p-4 flex flex-col justify-between">
                <Leaf className="w-5 h-5 text-primary-dark mb-3" />
                <div>
                  <p className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider mb-1">Energy Mode</p>
                  <p className="font-heading text-xl font-bold text-secondary-dark">{room.energyMode || "Eco"}</p>
                </div>
              </div>
            </div>

            {/* Active Devices List */}
            <div className="px-8 mb-6">
              <h3 className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest mb-4">Provisioned Devices</h3>
              
              {devices.length === 0 ? (
                <div className="text-sm text-secondary-light">No devices provisioned.</div>
              ) : (
                <div className="space-y-6">
                  {devices.map((device: any) => (
                    <div key={device.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getDeviceColor(device.type)}`}>
                          {getDeviceIcon(device.type)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-secondary-dark">{device.name}</h4>
                          <p className="text-xs text-secondary-light uppercase">{device.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full ${device.status === 'Running' || device.status === 'ONLINE' ? 'bg-primary' : 'bg-[#CBD5E1]'}`}></span>
                        <span className={`text-xs font-semibold ${device.status === 'Running' || device.status === 'ONLINE' ? 'text-primary-dark' : 'text-secondary-light'}`}>
                          {device.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Efficiency Score */}
            <div className="px-8 mb-6">
              <div className="bg-[#F5F7F5] rounded-xl p-4 flex items-center space-x-4">
                <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white border-4 border-primary-dark shrink-0">
                  <span className="text-xs font-bold text-secondary-dark">{efficiency}%</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-secondary-dark">Device Efficiency</h4>
                  <p className="text-xs text-secondary-light">Based on active running hardware</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-8 pb-8 pt-4 bg-white flex flex-col items-center space-y-4 shrink-0 border-t border-neutral-border/50">
            <RoleGuard allowedRoles={['admin']}>
            <Button 
              onClick={() => {
                onClose();
                router.push(`/rooms/${room.id}`);
              }}
              className="w-full bg-primary-dark hover:bg-primary text-white py-6 rounded-xl flex items-center justify-center space-x-2 text-sm font-semibold transition-colors shadow-sm"
            >
              <span>Go to Room Management</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <button className="text-sm font-semibold text-secondary-dark hover:text-primary transition-colors">
              Download Room Log
            </button>
            </RoleGuard>
          </div>
        </>
      </div>
    </div>
  );
}
