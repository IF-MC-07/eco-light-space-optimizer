"use client";
import React, { useState } from "react";
import { Breadcrumbs } from "../../../components/ui/Breadcrumbs";
import { RoomStatCard } from "../../../features/rooms/components/RoomStatCard";
import { ProvisionedDevicesTable } from "../../../features/rooms/components/ProvisionedDevicesTable";
import { AddDeviceModal } from "../../../features/rooms/components/AddDeviceModal";
import { EditDeviceModal } from "../../../features/rooms/components/EditDeviceModal";
import { UserCheck, Sun, Thermometer, ShieldCheck, UserCircle2, Lightbulb, Snowflake, CheckCircle, Video, LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";
import { MOCK_ROOMS } from "../../../mocks/roomData";

interface RoomManagementProps {
  roomId: string;
}

export default function RoomManagement({ roomId }: RoomManagementProps) {
  const router = useRouter();

  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  const room = MOCK_ROOMS.find(r => r.id === roomId) ?? MOCK_ROOMS[0];
  const cameraDevice = room.devices.find((d: any) => d.type === "Camera");

  const breadcrumbItems = [
    { label: "Campus", href: "/", onClick: () => router.push("/") },
    { label: "Room Availability", href: "/room-availability", onClick: () => router.push("/room-availability") },
    { label: `${room.name} Management`, active: true },
  ];

  return (
    <div className="w-full h-full flex flex-col space-y-8 max-w-7xl mx-auto p-6 md:p-8 bg-neutral">
      
      {/* Header Section */}
      <div className="space-y-2">
        <Breadcrumbs items={breadcrumbItems} />
        <h1 className="font-heading text-3xl font-bold text-secondary-dark tracking-tight">
          {room.name} Management
        </h1>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <RoomStatCard
          title="Occupancy"
          value="Active"
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
              <h3 className="text-xl font-bold text-secondary-dark leading-tight">Vision System Active</h3>
              <p className="text-secondary-light text-sm">Real-time occupancy monitoring & space zone optimization</p>
            </div>
          </div>
          <button 
            onClick={() => router.push(`/zone-configuration/${cameraDevice.id}`)}
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
          devices={room.devices as any[]}
          roomId={roomId} 
          onAddDevice={() => setIsAddDeviceOpen(true)}
          onEditDevice={(device: any) => setSelectedDevice(device)}
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
    </div>
  );
}
