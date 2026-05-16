"use client";
import React from "react";
import { Pencil, Settings, Trash2, LayoutGrid, Lamp, Radio, Video, Wind, Clock } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Switch } from "../../../components/ui/Switch";
import { cn } from "../../../lib/utils";
import { useRouter } from "next/navigation";
import { IotDevice } from "../../iot-device/types";

interface ProvisionedDevicesTableProps {
  devices: IotDevice[];
  roomId?: string;
  onAddDevice?: () => void;
  onEditDevice?: (device: IotDevice) => void;
  onRemoveDevice?: (device: IotDevice) => void;
  onEditSchedule?: (device: IotDevice) => void;
}

export function ProvisionedDevicesTable({ 
  devices = [], 
  roomId,
  onAddDevice,
  onEditDevice,
  onRemoveDevice,
  onEditSchedule
}: ProvisionedDevicesTableProps) {
  const router = useRouter();

  const getIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case "LIGHT": return <Lamp className="w-5 h-5" />;
      case "SENSOR": return <Radio className="w-5 h-5" />;
      case "CAMERA": return <Video className="w-5 h-5" />;
      case "AC": return <Wind className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="font-heading text-lg font-bold text-secondary-dark mb-1">Provisioned Devices</h3>
          <p className="text-sm text-secondary-light">Managing {devices.length} active IoT nodes</p>
        </div>
        <Button 
          onClick={onAddDevice}
          className="bg-primary-dark hover:bg-primary text-white text-xs font-bold uppercase tracking-widest px-6 py-3 h-11 rounded-xl shadow-lg shadow-primary-dark/20 transition-all flex items-center gap-2"
        >
          <span>+ Add Device to Room</span>
        </Button>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-12 gap-4 px-6 pb-4 text-[10px] font-bold text-secondary-dark uppercase tracking-widest border-b border-neutral-border">
          <div className="col-span-5">DEVICE NAME</div>
          <div className="col-span-3">TYPE</div>
          <div className="col-span-2">STATUS</div>
          <div className="col-span-2 text-right">ACTIONS</div>
        </div>

        <div className="space-y-3 mt-4">
          {devices.map((device) => (
            <div
              key={device.device_id}
              className={cn(
                "grid grid-cols-12 gap-4 items-center bg-[#F8FAFC] p-4 rounded-lg transition-colors hover:bg-[#F1F5F9] relative overflow-hidden",
                device.device_type === "CAMERA" && "bg-white border border-[#E2E8F0] shadow-sm"
              )}
            >
              {device.device_type === "CAMERA" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-light"></div>
              )}

              <div className="col-span-5 flex items-center space-x-4 pl-2">
                <div className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-md text-secondary-dark",
                  device.device_type === "CAMERA" ? "bg-primary-dark text-white" : "bg-[#E2E8F0]"
                )}>
                  {getIcon(device.device_type)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-secondary-dark">{device.device_name}</h4>
                </div>
              </div>

              <div className="col-span-3">
                <span className="text-xs font-semibold text-secondary-light">{device.device_type}</span>
              </div>

              <div className="col-span-2">
                <Switch
                  checked={device.status === 'ACTIVE' || device.status === 'ON' || device.status === 'Running'}
                  onCheckedChange={() => {}}
                />
              </div>

              <div className="col-span-2 flex items-center justify-end space-x-3 text-secondary-light">
                {device.device_type === "CAMERA" && (
                  <button 
                    onClick={() => router.push(`/zone-configuration/${device.device_id}`)}
                    className="hidden lg:flex items-center space-x-1 bg-[#D1FAE5] text-primary-dark px-3 py-1.5 rounded text-xs font-bold mr-2 hover:bg-[#A7F3D0] transition-colors"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>Zones</span>
                  </button>
                )}
                <button 
                  onClick={() => onEditDevice && onEditDevice(device)}
                  className="hover:text-secondary-dark transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {(device.device_type === "AC" || device.device_type === "LIGHT") && (
                  <button 
                    onClick={() => onEditSchedule && onEditSchedule(device)}
                    className="hover:text-secondary-dark transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => onRemoveDevice && onRemoveDevice(device)}
                  className="hover:text-tertiary transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
