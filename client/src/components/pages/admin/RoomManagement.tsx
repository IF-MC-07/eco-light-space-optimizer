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
import { useCameraList, useDeleteCamera } from "../../../features/camera/hooks";

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
  const { mutate: removeCamera } = useDeleteCamera();

  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [deviceToRemove, setDeviceToRemove] = useState<any>(null);
  const [deviceToEditSchedule, setDeviceToEditSchedule] = useState<any>(null);

  const room = roomResponse?.data;
  const iotDevices = devicesResponse?.data || [];
  const cameras = ((camerasResponse as any)?.data || camerasResponse || []).map(
    (cam: any) => ({
      device_id: cam.camera_id,
      device_name: cam.name || cam.camera_id,
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
      if (deviceToRemove.device_type?.toUpperCase() === "CAMERA") {
        removeCamera(deviceToRemove.device_id, {
          onSuccess: () => setDeviceToRemove(null),
        });
      } else {
        removeDevice(deviceToRemove.device_id, {
          onSuccess: () => setDeviceToRemove(null),
        });
      }
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
          value="Tidak ada data"
          icon={<Thermometer className="w-4 h-4" />}
          iconBgClass="bg-[#EDE9FE]"
          iconColorClass="text-[#7C3AED]"
          watermarkIcon={<Snowflake className="w-24 h-24 stroke-1" />}
        />
        <RoomStatCard
          title="Device Health"
          value="Tidak ada data"
          icon={<ShieldCheck className="w-4 h-4" />}
          iconBgClass="bg-[#F1F5F9]"
          iconColorClass="text-[#0F172A]"
          watermarkIcon={<CheckCircle className="w-24 h-24 stroke-1" />}
        />
      </div>

      {/* Vision System Section */}
      {!cameraDevice ? (
        <div className="w-full bg-[#F8FAFC] rounded-2xl p-6 border border-neutral-border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 shadow-sm">
              <Video className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-secondary-dark leading-tight">
                Belum Ada Kamera
              </h3>
              <p className="text-secondary-light text-sm">
                Kamera belum dikonfigurasi untuk ruangan ini.
              </p>
            </div>
          </div>
        </div>
      ) : (
        (() => {
          const isCamActive =
            cameraDevice.status?.toUpperCase() === "ACTIVE" ||
            cameraDevice.status?.toLowerCase() === "aktif";

          return (
            <div className="w-full bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] rounded-2xl p-6 border border-neutral-border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-6">
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-md ${
                    isCamActive ? "bg-primary-dark" : "bg-slate-500"
                  }`}
                >
                  <Video className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-secondary-dark leading-tight">
                      {isCamActive ? "Vision System Aktif" : "Vision System Offline"}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wider ${
                        isCamActive
                          ? "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]"
                          : "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]"
                      }`}
                    >
                      {isCamActive ? "Aktif" : "Offline"}
                    </span>
                  </div>
                  <p className="text-secondary-light text-sm mt-0.5">
                    {isCamActive
                      ? "Pemantauan okupansi dan optimasi zona ruangan berjalan secara real-time."
                      : "Kamera pengawas terputus atau dinonaktifkan."}
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
          );
        })()
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
