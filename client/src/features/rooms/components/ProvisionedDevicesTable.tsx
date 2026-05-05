"use client";
import React, { useState, useEffect } from "react";
import { Pencil, Settings, Trash2, LayoutGrid, Lamp, Radio, Video, Wind } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Switch } from "../../../components/ui/Switch";
import { cn } from "../../../lib/utils";
import { useRouter } from "next/navigation";

interface Device {
  id: string;
  name: string;
  type: string;
  status: string;
  statusBool?: boolean;
  hasHdStream?: boolean;
}

interface ProvisionedDevicesTableProps {
  devices?: Device[];
  roomId?: string;
  onAddDevice?: () => void;
  onEditDevice?: (device: Device) => void;
}

export function ProvisionedDevicesTable({ 
  devices: initialDevices = [], 
  roomId,
  onAddDevice,
  onEditDevice 
}: ProvisionedDevicesTableProps) {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>(initialDevices);

  useEffect(() => {
    if (initialDevices.length > 0) {
      setDevices(initialDevices);
    }
  }, [initialDevices]);

  const toggleStatus = (id: string) => {
    setDevices(devices.map(d => d.id === id ? { ...d, statusBool: !d.statusBool, status: !d.statusBool ? "Running" : "Standby" } : d));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Light": return <Lamp className="w-5 h-5" />;
      case "Sensor": return <Radio className="w-5 h-5" />;
      case "Camera": return <Video className="w-5 h-5" />;
      case "AC": return <Wind className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="font-heading text-lg font-bold text-secondary-dark mb-1">Provisioned Devices</h3>
          <p className="text-sm text-secondary-light">Managing {devices.length} active IoT nodes in Room {roomId || "606"}</p>
        </div>
        <Button 
          onClick={onAddDevice}
          className="bg-primary-dark hover:bg-primary text-white text-sm py-2 px-4 h-10 rounded-md shadow-sm transition-colors flex items-center gap-2"
        >
          <span>+ Add Device to Room</span>
        </Button>
      </div>

      <div className="w-full">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 pb-4 text-[10px] font-bold text-secondary-dark uppercase tracking-widest border-b border-neutral-border">
          <div className="col-span-5">DEVICE NAME</div>
          <div className="col-span-3">TYPE</div>
          <div className="col-span-2">STATUS</div>
          <div className="col-span-2 text-right">ACTIONS</div>
        </div>

        {/* Table Body */}
        <div className="space-y-3 mt-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className={cn(
                "grid grid-cols-12 gap-4 items-center bg-[#F8FAFC] p-4 rounded-lg transition-colors hover:bg-[#F1F5F9] relative overflow-hidden",
                device.type === "Camera" && "bg-white border border-[#E2E8F0] shadow-sm"
              )}
            >
              {/* Green Left Border Highlight for Camera */}
              {device.type === "Camera" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-light"></div>
              )}

              {/* Device Name Column */}
              <div className="col-span-5 flex items-center space-x-4 pl-2">
                <div className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-md text-secondary-dark",
                  device.type === "Camera" ? "bg-primary-dark text-white" : "bg-[#E2E8F0]"
                )}>
                  {getIcon(device.type)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-secondary-dark">{device.name}</h4>
                  {device.hasHdStream && (
                     <span className="text-[9px] font-bold text-primary bg-primary-light/10 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">
                      HD STREAM
                    </span>
                  )}
                </div>
              </div>

              {/* Type Column */}
              <div className="col-span-3">
                <span className="text-xs font-semibold text-secondary-light">{device.type}</span>
              </div>

              {/* Status Column */}
              <div className="col-span-2">
                <Switch
                  checked={device.statusBool !== undefined ? device.statusBool : device.status === 'Running' || device.status === 'ONLINE'}
                  onCheckedChange={() => toggleStatus(device.id)}
                />
              </div>

              {/* Actions Column */}
              <div className="col-span-2 flex items-center justify-end space-x-3 text-secondary-light">
                {device.type === "Camera" && (
                  <button 
                    onClick={() => router.push(`/zone-configuration/${device.id}`)}
                    className="hidden lg:flex items-center space-x-1 bg-[#D1FAE5] text-primary-dark px-3 py-1.5 rounded text-xs font-bold mr-2 hover:bg-[#A7F3D0] transition-colors"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>Configure Zones</span>
                  </button>
                )}
                <button 
                  onClick={() => onEditDevice && onEditDevice(device)}
                  className="hover:text-secondary-dark transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {device.type !== "Camera" && (
                  <button className="hover:text-secondary-dark transition-colors"><Settings className="w-4 h-4" /></button>
                )}
                <button className="hover:text-tertiary transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
