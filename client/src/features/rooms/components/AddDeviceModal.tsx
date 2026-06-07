"use client";
import React, { useState, useEffect } from "react";
import { X, QrCode, Info, MonitorSpeaker } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useCreateDevice } from "../../iot-device/hooks";
import { serverAPI } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
}

export function AddDeviceModal({
  isOpen,
  onClose,
  roomId,
}: AddDeviceModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [type, setType] = useState<string>("LIGHT");

  // Additional state for dynamic fields
  const [relayChannel, setRelayChannel] = useState(1);
  const [zoneId, setZoneId] = useState("");
  const [temperatureSetting, setTemperatureSetting] = useState(24);
  const [ipAddress, setIpAddress] = useState("");
  const [resolution, setResolution] = useState("800x600");
  const [ipError, setIpError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [zones, setZones] = useState<any[]>([]);

  // State for custom form submission loading
  const [isCustomPending, setIsCustomPending] = useState(false);

  const { mutate: createDevice, isPending, error } = useCreateDevice();

  // Fetch zones when type is LIGHT and roomId is available
  useEffect(() => {
    if (type === "LIGHT" && roomId) {
      serverAPI
        .get(`/zones?room_id=${roomId}`)
        .then((r) => {
          const allZones = r.data?.data || [];
          const filteredZones = allZones.filter(
            (zone: any) => String(zone.room_id) === String(roomId)
          );
          setZones(filteredZones);
        })
        .catch((err) => console.error("Failed to fetch zones data", err));
    }
  }, [type, roomId]);

  const handleClose = () => {
    // Reset basic state
    setName("");
    setType("LIGHT");
    // Reset additional state to default values
    setRelayChannel(1);
    setZoneId("");
    setTemperatureSetting(24);
    setIpAddress("");
    setResolution("800x600");
    setIpError("");
    setCameraError("");
    onClose();
  };

  const handleIpChange = (val: string) => {
    setIpAddress(val);
    const parts = val.split(".");

    if (parts.length === 4) {
      const isValid = parts.every((part) => {
        if (part === "") return false;
        const num = Number(part);
        return !isNaN(num) && num >= 0 && num <= 255;
      });

      if (!isValid) {
        setIpError("Invalid IP format");
      } else {
        setIpError("");
      }
    } else if (parts.length > 4) {
      setIpError("Invalid IP format");
    } else {
      // Do not show error while user is still typing (e.g. less than 4 parts)
      setIpError("");
    }
  };

  const isFormValid = () => {
    if (type === "CAMERA") {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      const parts = ipAddress.split(".");
      const isValidIp =
        parts.length === 4 &&
        parts.every((part) => {
          parts.every((p) => parseInt(p) >= 0 && parseInt(p) <= 255);
          if (part === "") return false;
          const num = Number(part);
          return !isNaN(num) && num >= 0 && num <= 255;
        });
      return !ipAddress && isValidIp;
    }

    if (!name) return false;
    if (type === "LIGHT") return !!zoneId && !!relayChannel;
    return true; // AC & SENSOR
  };

  const handleCreate = async () => {
    if (!roomId) return;
    setCameraError("");

    // Special logic for CAMERA (do not submit to iot-devices)
    if (type === "CAMERA") {
      setIsCustomPending(true);
      try {
        await serverAPI.post("/cameras", {
          room_id: roomId,
          ip_address: ipAddress,
          resolution: resolution,
          status: "aktif",
        });
        toast.success("Camera successfully added");
        queryClient.invalidateQueries({ queryKey: ["cameras"] });
        queryClient.invalidateQueries({ queryKey: ["iot-devices"] });
        handleClose();
      } catch (err: any) {
        const errMsg =
          err.response?.data?.message ||
          err.message ||
          "Failed to add camera. Try again.";
        setCameraError(errMsg);
        console.error("Failed to add camera", err);
      } finally {
        setIsCustomPending(false);
      }
      return;
    }

    // Logic for LIGHT, AC, and SENSOR
    createDevice(
      {
        room_id: roomId,
        device_name: name,
        device_type: type,
        status: "ACTIVE",
      },
      {
        onSuccess: async (res: any) => {
          const deviceId = res?.data?.device_id;
          if (!deviceId) {
            toast.success("Device successfully added");
            queryClient.invalidateQueries({ queryKey: ["iot-devices"] });
            handleClose();
            return;
          }

          // Sequential additional requests after device is created
          try {
            if (type === "LIGHT") {
              await serverAPI.post("/light-controls", {
                zone_id: zoneId,
                device_id: deviceId,
                relay_channel: Number(relayChannel),
                light_status: "OFF",
              });
            } else if (type === "AC") {
              await serverAPI.post("/ac-controls", {
                room_id: roomId,
                device_id: deviceId,
                temperature_setting: Number(temperatureSetting),
                ac_status: "OFF",
              });
            }
            toast.success("Device successfully added");
            queryClient.invalidateQueries({ queryKey: ["iot-devices"] });
          } catch (err) {
            console.error("Failed to create additional control", err);
            toast.error(
              "Device created, but failed to save additional configuration",
            );
            queryClient.invalidateQueries({ queryKey: ["iot-devices"] });
          }
          handleClose();
        },
      },
    );
  };

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
            <h2 className="font-heading text-2xl font-bold text-secondary-dark mb-1">
              Add New Device
            </h2>
            <p className="text-secondary-light text-sm leading-relaxed max-w-[320px]">
              Integrate a new hardware endpoint into the ecosystem.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-secondary-dark hover:text-primary transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 space-y-5">
          {error && type !== "CAMERA" && (
            <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm">
              Error creating device. Please try again.
            </div>
          )}

          {cameraError && type === "CAMERA" && (
            <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm">
              {cameraError}
            </div>
          )}

          {type !== "CAMERA" && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">
                Device Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Room Light 1"
                className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark placeholder-secondary-light focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">
              Device Type
            </label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 pl-4 pr-10 py-3.5 appearance-none cursor-pointer"
              >
                <option value="LIGHT">Lighting</option>
                <option value="AC">Climate (AC)</option>
                <option value="SENSOR">Sensor</option>
                <option value="CAMERA">Camera</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Dynamic Field Container with Animation */}
          <div className="transition-all duration-300 space-y-5">
            {type === "LIGHT" && (
              <>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">
                    Zone*
                  </label>
                  <div className="relative">
                    <select
                      value={zoneId}
                      onChange={(e) => setZoneId(e.target.value)}
                      className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 pl-4 pr-10 py-3.5 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>
                        Select Zone
                      </option>
                      {zones.map((zone) => (
                        <option key={zone.zone_id} value={zone.zone_id}>
                          {zone.zone_name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">
                    Relay Channel*
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={relayChannel}
                    onChange={(e) => setRelayChannel(Number(e.target.value))}
                    placeholder="1"
                    className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark placeholder-secondary-light focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5"
                  />
                  <p className="text-xs text-secondary-light">
                    Relay channel on ESP32 (1-4)
                  </p>
                </div>
              </>
            )}

            {type === "AC" && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">
                  Temperature Setting
                </label>
                <input
                  type="number"
                  min="16"
                  max="30"
                  value={temperatureSetting}
                  onChange={(e) =>
                    setTemperatureSetting(Number(e.target.value))
                  }
                  placeholder="24"
                  className="w-full bg-[#E2E8F0] bg-opacity-50 border-none rounded-lg text-base text-secondary-dark placeholder-secondary-light focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5"
                />
                <p className="text-xs text-secondary-light">
                  Default AC temperature in Celsius
                </p>
              </div>
            )}

            {type === "CAMERA" && (
              <>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">
                    IP Address*
                  </label>
                  <input
                    type="text"
                    value={ipAddress}
                    onChange={(e) => handleIpChange(e.target.value)}
                    placeholder="192.168.1.100"
                    className={`w-full bg-[#E2E8F0] bg-opacity-50 border ${ipError ? "border-red-500" : "border-none"} rounded-lg text-base text-secondary-dark placeholder-secondary-light focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5`}
                  />
                  {ipError && (
                    <p className="text-xs text-red-500 mt-1">{ipError}</p>
                  )}
                  {!ipError && (
                    <p className="text-xs text-secondary-light mt-1">
                      ESP32-CAM IP address on local Wi-Fi network
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">
                    Resolution
                  </label>
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
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-[#F8FAFC] rounded-xl p-4 flex space-x-3 mt-4 border border-neutral-border/40">
            <div className="mt-0.5">
              <Info className="w-5 h-5 text-primary-dark" />
            </div>
            <p className="text-xs text-secondary-light leading-relaxed">
              New devices are automatically registered and can be configured for
              automation.
            </p>
          </div>
        </div>

        <div className="px-8 py-8 bg-white flex items-center justify-end space-x-8 mt-2">
          <button
            onClick={handleClose}
            disabled={isPending || isCustomPending}
            className="text-sm font-bold text-secondary-dark hover:text-primary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <Button
            onClick={handleCreate}
            disabled={isPending || isCustomPending || !roomId || !isFormValid()}
            className="bg-primary-dark hover:bg-primary text-white py-3 px-6 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center space-x-2 disabled:opacity-50"
          >
            <MonitorSpeaker className="w-5 h-5" />
            <span>
              {isPending || isCustomPending ? "Adding..." : "Add Device"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
