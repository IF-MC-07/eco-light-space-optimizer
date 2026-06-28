"use client";
import React, { useState, useEffect } from "react";
import { Leaf } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useUpdateDevice } from "../../iot-device/hooks";
import type { IotDevice } from "../../iot-device/types";
import { serverAPI } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface EditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device?: IotDevice;
}

export function EditDeviceModal({ isOpen, onClose, device }: EditDeviceModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string>("ACTIVE");

  const [controlId, setControlId] = useState("");
  // Additional state for dynamic fields
  const [relayChannel, setRelayChannel] = useState(1);
  const [zoneId, setZoneId] = useState("");
  const [temperatureSetting, setTemperatureSetting] = useState(24);
  const [ipAddress, setIpAddress] = useState("");
  const [resolution, setResolution] = useState("800x600");
  const [ipError, setIpError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [zones, setZones] = useState<any[]>([]);

  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isCustomPending, setIsCustomPending] = useState(false);

  const { mutate: updateDevice, isPending, error } = useUpdateDevice();

  useEffect(() => {
    if (device && isOpen) {
      setName(device.device_name);
      setStatus(device.status);
      setCameraError("");
      setIpError("");

      setIsLoadingDetails(true);
      const fetchDetails = async () => {
        try {
          if (device.device_type === "LIGHT") {
            const zRes = await serverAPI.get(`/zones?room_id=${device.room_id}`);
            const allZones = zRes.data?.data || [];
            const filteredZones = allZones.filter((z: any) => String(z.room_id) === String(device.room_id));
            setZones(filteredZones);

            const lcRes = await serverAPI.get("/light-controls");
            const controls = lcRes.data?.data || [];
            const myControl = controls.find((c: any) => c.device_id === device.device_id);
            if (myControl) {
              setControlId(myControl.control_id);
              setZoneId(myControl.zone_id);
              setRelayChannel(myControl.relay_channel);
            }
          } else if (device.device_type === "AC") {
            const acRes = await serverAPI.get("/ac-controls");
            const controls = acRes.data?.data || [];
            const myControl = controls.find((c: any) => c.device_id === device.device_id);
            if (myControl) {
              setControlId(myControl.ac_control_id);
              setTemperatureSetting(myControl.temperature_setting);
            }
          } else if (device.device_type === "CAMERA") {
            const camRes = await serverAPI.get(`/cameras/${device.device_id}`);
            const cam = camRes.data?.data;
            if (cam) {
              setIpAddress(cam.ip_address || "");
              setResolution(cam.resolution || "800x600");
            }
          }
        } catch (err) {
          console.error("Failed to fetch device specific details", err);
        } finally {
          setIsLoadingDetails(false);
        }
      };
      
      fetchDetails();
    }
  }, [device, isOpen]);

  const handleIpChange = (val: string) => {
    setIpAddress(val);
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const rtspRegex = /^rtsp:\/\/.+/i;
    const httpRegex = /^https?:\/\/.+/i;

    if (val === "") {
      setIpError("");
    } else if (ipRegex.test(val)) {
      const parts = val.split(".");
      const valid = parts.every((p) => parseInt(p) >= 0 && parseInt(p) <= 255);
      setIpError(valid ? "" : "Invalid IP format");
    } else if (rtspRegex.test(val) || httpRegex.test(val)) {
      setIpError("");
    } else {
      setIpError("Enter a valid IP address or stream URL (rtsp:// / http://)");
    }
  };

  const isFormValid = () => {
    if (!device) return false;
    if (device.device_type === "CAMERA") {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      const rtspRegex = /^rtsp:\/\/.+/i;
      const httpRegex = /^https?:\/\/.+/i;
      const isValid = ipRegex.test(ipAddress) || rtspRegex.test(ipAddress) || httpRegex.test(ipAddress);
      return !!name && !!ipAddress && isValid && !ipError;
    }

    if (!name) return false;
    if (device.device_type === "LIGHT") return !!zoneId && !!relayChannel;
    return true;
  };

  const handleUpdate = async () => {
    if (!device) return;

    if (device.device_type === "CAMERA") {
      setIsCustomPending(true);
      try {
        await serverAPI.put(`/cameras/${device.device_id}`, {
          name: name,
          ip_address: ipAddress,
          resolution: resolution,
          status: status === "ACTIVE" ? "aktif" : status,
        });
        toast.success("Camera updated successfully");
        queryClient.invalidateQueries({ queryKey: ["cameras"] });
        queryClient.invalidateQueries({ queryKey: ["iot-devices"] });
        onClose();
      } catch (err: any) {
        const errMsg = err.response?.data?.message || err.message || "Failed to update camera. Try again.";
        setCameraError(errMsg);
      } finally {
        setIsCustomPending(false);
      }
      return;
    }

    updateDevice(
      { 
        id: device.device_id, 
        payload: { device_name: name, device_type: device.device_type, status } 
      },
      {
        onSuccess: async () => {
          try {
            if (device.device_type === "LIGHT" && controlId) {
              await serverAPI.put(`/light-controls/${controlId}`, {
                zone_id: zoneId,
                relay_channel: Number(relayChannel)
              });
            } else if (device.device_type === "AC" && controlId) {
              await serverAPI.put(`/ac-controls/${controlId}`, {
                temperature_setting: Number(temperatureSetting)
              });
            }
            toast.success("Device updated successfully");
          } catch (err) {
            console.error(err);
            toast.error("Device updated but failed to save specific configuration");
          }
          queryClient.invalidateQueries({ queryKey: ["iot-devices"] });
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
          {error && device.device_type !== "CAMERA" && (
            <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm">
              Error updating device. Please try again.
            </div>
          )}

          {cameraError && device.device_type === "CAMERA" && (
            <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm">
              {cameraError}
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

          {isLoadingDetails ? (
            <div className="text-center py-4 text-secondary-light text-sm">Loading details...</div>
          ) : (
            <div className="transition-all duration-300 space-y-6">
              {device.device_type === "LIGHT" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-secondary-dark">Zone*</label>
                    <div className="relative">
                      <select
                        value={zoneId}
                        onChange={(e) => setZoneId(e.target.value)}
                        className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 pl-4 pr-10 py-3.5 appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select Zone</option>
                        {zones.map((zone) => (
                          <option key={zone.zone_id} value={zone.zone_id}>
                            {zone.zone_name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-secondary-dark">Relay Channel*</label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={relayChannel}
                      onChange={(e) => setRelayChannel(Number(e.target.value))}
                      placeholder="1"
                      className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5"
                    />
                    <p className="text-xs text-secondary-light">Relay channel on ESP32 (1-4)</p>
                  </div>
                </>
              )}

              {device.device_type === "AC" && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary-dark">Temperature Setting</label>
                  <input
                    type="number"
                    min="16"
                    max="30"
                    value={temperatureSetting}
                    onChange={(e) => setTemperatureSetting(Number(e.target.value))}
                    placeholder="24"
                    className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5"
                  />
                  <p className="text-xs text-secondary-light">Default AC temperature in Celsius</p>
                </div>
              )}

              {device.device_type === "CAMERA" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-secondary-dark">IP Address or Stream URL</label>
                    <input
                      type="text"
                      value={ipAddress}
                      onChange={(e) => handleIpChange(e.target.value)}
                      placeholder="192.168.1.100 or rtsp://..."
                      className={`w-full bg-[#E2E8F0] bg-opacity-50 border ${ipError ? "border-red-500" : "border-none"} rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5`}
                    />
                    {ipError ? (
                      <p className="text-xs text-red-500 mt-1">{ipError}</p>
                    ) : (
                      <p className="text-xs text-secondary-light mt-1">ESP32-CAM IP address</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-secondary-dark">Resolution</label>
                    <div className="relative">
                      <select
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 pl-4 pr-10 py-3.5 appearance-none cursor-pointer"
                      >
                        <option value="320x240">320x240</option>
                        <option value="640x480">640x480</option>
                        <option value="800x600">800x600</option>
                        <option value="1024x768">1024x768</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

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
            disabled={isPending || isCustomPending}
            className="text-sm font-bold text-secondary-dark hover:text-primary transition-colors disabled:opacity-50"
          >
            Discard Changes
          </button>
          <Button 
            onClick={handleUpdate}
            disabled={isPending || isCustomPending || !isFormValid()}
            className="bg-primary-dark hover:bg-primary text-white py-3 px-6 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            {isPending || isCustomPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
