"use client";
import React, { useState, useEffect } from "react";
import { Leaf } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useUpdateDevice } from "../../iot-device/hooks";
import type { IotDevice } from "../../iot-device/types";

interface EditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device?: IotDevice;
}

export function EditDeviceModal({ isOpen, onClose, device }: EditDeviceModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("LIGHT");
  const [status, setStatus] = useState<string>("ACTIVE");

  const { mutate: updateDevice, isPending, error } = useUpdateDevice();

  useEffect(() => {
    if (device) {
      setName(device.device_name);
      setType(device.device_type);
      setStatus(device.status);
    }
  }, [device]);

  const handleUpdate = () => {
    if (!device) return;
    updateDevice(
      { 
        id: device.device_id, 
        payload: { device_name: name, device_type: type, status } 
      },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  if (!isOpen || !device) return null;

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
          {error && (
            <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm">
              Error updating device. Please try again.
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary-dark">Device Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary-dark">Category</label>
            <div className="relative">
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5 appearance-none cursor-pointer"
              >
                <option value="LIGHT">Lighting</option>
                <option value="AC">Climate Control</option>
                <option value="SENSOR">Sensor</option>
                <option value="CAMERA">Camera</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary-dark">Device Status</label>
            <div className="relative">
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5 appearance-none cursor-pointer"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="OFFLINE">Offline</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="bg-[#F0FDF4]/50 border border-[#bbf7d0] rounded-xl p-4 flex space-x-3 mt-4">
            <div className="mt-0.5">
              <Leaf className="w-5 h-5 text-primary-dark" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-primary-dark mb-1">Device Operational</h4>
              <p className="text-xs text-secondary-dark leading-relaxed">
                Changes will be synced to the IoT network immediately.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-6 mt-10">
          <button 
            onClick={onClose}
            disabled={isPending}
            className="text-sm font-bold text-secondary-dark hover:text-primary transition-colors disabled:opacity-50"
          >
            Discard Changes
          </button>
          <Button 
            onClick={handleUpdate}
            disabled={isPending}
            className="bg-primary-dark hover:bg-primary text-white py-3 px-6 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
