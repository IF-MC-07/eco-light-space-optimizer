"use client";
import React, { useState } from "react";
import { Breadcrumbs } from "../../../components/ui/Breadcrumbs";
import { RoomStatCard } from "../../../features/rooms/components/RoomStatCard";
import { ProvisionedDevicesTable } from "../../../features/rooms/components/ProvisionedDevicesTable";
import { AddDeviceModal } from "../../../features/rooms/components/AddDeviceModal";
import { EditDeviceModal } from "../../../features/rooms/components/EditDeviceModal";
import { EditScheduleModal } from "../../../features/automation/components/EditScheduleModal";
import { AlertDialog } from "../../../components/ui/AlertDialog";
import {
  UserCheck,
  Sun,
  Thermometer,
  ShieldCheck,
  UserCircle2,
  Lightbulb,
  Snowflake,
  CheckCircle,
  Video,
  LayoutGrid,
  Settings,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { EditRoomModal } from "../../../features/rooms/components/EditRoomModal";
import { useRoom, useRemoveRoom } from "../../../features/rooms/hooks";
import {
  useDevices,
  useRemoveDevice,
} from "../../../features/iot-device/hooks";
import { useCameraList } from "../../../features/camera/hooks";

interface RoomManagementProps {
  roomId: string;
}

export default function RoomManagement({ roomId }: RoomManagementProps) {
  const router = useRouter();
  const { data: roomResponse, isLoading: isRoomLoading } = useRoom(roomId);
  const { data: devicesResponse, isLoading: isDevicesLoading } =
    useDevices(roomId);
  const { data: camerasResponse, isLoading: isCamerasLoading } = useCameraList({
    room_id: roomId,
  });
  const { mutate: removeRoom } = useRemoveRoom();
  const { mutate: removeDevice } = useRemoveDevice();

  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [deviceToRemove, setDeviceToRemove] = useState<any>(null);
  const [deviceToEditSchedule, setDeviceToEditSchedule] = useState<any>(null);

  const room = roomResponse?.data;
  const iotDevices = devicesResponse?.data || [];
  const cameras = (camerasResponse?.data || camerasResponse || []).map(
    (cam: any) => ({
      device_id: cam.camera_id,
      device_name: cam.camera_id,
      device_type: "CAMERA",
      status: cam.status === "aktif" ? "ACTIVE" : cam.status,
      room_id: cam.room_id,
    }),
  );
  const devices = [...iotDevices, ...cameras];
  const cameraDevice = devices.find(
    (d: any) => d.device_type?.toUpperCase() === "CAMERA",
  );

  if (isRoomLoading || isDevicesLoading || isCamerasLoading)
    return <div className="p-20 text-center">Loading room management...</div>;
  if (!room)
    return (
      <div className="p-20 text-center text-tertiary font-bold">
        Room not found
      </div>
    );

  const breadcrumbItems = [
    { label: "Campus", href: "/", onClick: () => router.push("/") },
    {
      label: "Room Availability",
      href: "/room-availability",
      onClick: () => router.push("/room-availability"),
    },
    { label: `${room.room_name} Management`, active: true },
  ];

  const handleDeleteRoom = () => {
    removeRoom(roomId, {
      onSuccess: () => router.push("/room-availability"),
    });
  };

  const handleDeleteDevice = () => {
    if (deviceToRemove) {
      removeDevice(deviceToRemove.device_id, {
        onSuccess: () => setDeviceToRemove(null),
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-8 max-w-7xl mx-auto p-6 md:p-8 bg-neutral">
      {/* Header Section */}
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="font-heading text-3xl font-bold text-secondary-dark tracking-tight">
            {room.room_name} Management
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsEditRoomOpen(true)}
            className="bg-white border-2 border-secondary-dark/10 text-secondary-dark font-bold h-11 px-6 rounded-xl shadow-sm hover:border-secondary-dark hover:bg-secondary-dark hover:text-white transition-all flex items-center gap-2 group"
          >
            <Settings
              size={18}
              className="text-secondary-dark group-hover:text-white transition-colors"
            />
            Edit Room
          </button>
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="bg-white border-2 border-[#DC2626]/10 text-[#DC2626] font-bold h-11 px-6 rounded-xl shadow-sm hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white transition-all flex items-center gap-2 group"
          >
            <Trash2
              size={18}
              className="text-[#DC2626] group-hover:text-white transition-colors"
            />
            Delete Room
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <RoomStatCard
          title="Occupancy"
          value={room.status === "ACTIVE" ? "Active" : "Inactive"}
          isLive={true}
          icon={<UserCheck className="w-4 h-4" />}
          iconBgClass="bg-[#D1FAE5]"
          iconColorClass="text-[#059669]"
          watermarkIcon={<UserCircle2 className="w-24 h-24 stroke-1" />}
        />
        <RoomStatCard
          title="Lighting"
          value="Auto"
          icon={<Sun className="w-4 h-4" />}
          iconBgClass="bg-[#DBEAFE]"
          iconColorClass="text-[#2563EB]"
          watermarkIcon={<Lightbulb className="w-24 h-24 stroke-1" />}
        />
        <RoomStatCard
          title="Climate Control"
          value="23°C"
          icon={<Thermometer className="w-4 h-4" />}
          iconBgClass="bg-[#EDE9FE]"
          iconColorClass="text-[#7C3AED]"
          watermarkIcon={<Snowflake className="w-24 h-24 stroke-1" />}
        />
        <RoomStatCard
          title="Device Health"
          value="99%"
          icon={<ShieldCheck className="w-4 h-4" />}
          iconBgClass="bg-[#F1F5F9]"
          iconColorClass="text-[#0F172A]"
          watermarkIcon={<CheckCircle className="w-24 h-24 stroke-1" />}
        />
      </div>

      {/* Vision System Section */}
      {cameraDevice && (
        <div className="w-full bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] rounded-2xl p-6 border border-neutral-border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary-dark rounded-xl flex items-center justify-center text-white shadow-md">
              <Video className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-secondary-dark leading-tight">
                Vision System Active
              </h3>
              <p className="text-secondary-light text-sm">
                Real-time occupancy monitoring & space zone optimization
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              router.push(`/zone-configuration/${cameraDevice.device_id}`)
            }
            className="w-full md:w-auto px-6 py-3 bg-white border-2 border-primary-dark text-primary-dark rounded-xl font-bold hover:bg-primary-dark hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <LayoutGrid className="w-4 h-4" />
            Configure Space Zones
          </button>
        </div>
      )}

      {/* Devices Table Section */}
      <div className="w-full bg-white rounded-2xl shadow-sm p-8 border border-neutral-border">
        <ProvisionedDevicesTable
          devices={devices}
          roomId={roomId}
          onAddDevice={() => setIsAddDeviceOpen(true)}
          onEditDevice={(device: any) => setSelectedDevice(device)}
          onRemoveDevice={(device: any) => setDeviceToRemove(device)}
          onEditSchedule={(device: any) => setDeviceToEditSchedule(device)}
        />
      </div>

      {/* Modals */}
      <AddDeviceModal
        isOpen={isAddDeviceOpen}
        onClose={() => setIsAddDeviceOpen(false)}
        roomId={roomId}
      />

      <EditDeviceModal
        isOpen={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
        device={selectedDevice}
      />

      <EditRoomModal
        isOpen={isEditRoomOpen}
        onClose={() => setIsEditRoomOpen(false)}
        room={room as any}
      />

      <EditScheduleModal
        isOpen={!!deviceToEditSchedule}
        onClose={() => setDeviceToEditSchedule(null)}
        schedule={null}
      />

      <AlertDialog
        isOpen={!!deviceToRemove}
        onClose={() => setDeviceToRemove(null)}
        onConfirm={handleDeleteDevice}
        title="Delete Device?"
        description={
          <span>
            Are you sure you want to remove{" "}
            <strong>{deviceToRemove?.device_name}</strong> from Room{" "}
            {room.room_name}? This action cannot be undone.
          </span>
        }
        confirmText="Delete Device"
        cancelText="Cancel"
      />

      <AlertDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteRoom}
        title="Delete Entire Room?"
        description={
          <span>
            Are you sure you want to delete <strong>{room.room_name}</strong>?
            This will remove all associated devices and schedules.
          </span>
        }
        confirmText="Delete Everything"
        cancelText="Keep Room"
      />
    </div>
  );
}
