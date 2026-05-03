import React from "react";
import { Breadcrumbs } from "../../../components/ui/Breadcrumbs";
import { RoomStatCard } from "../../../features/rooms/components/RoomStatCard";
import { ProvisionedDevicesTable } from "../../../features/rooms/components/ProvisionedDevicesTable";
import { UserCheck, Sun, Thermometer, ShieldCheck, UserCircle2, Lightbulb, Snowflake, CheckCircle } from "lucide-react";

export default function RoomManagement() {
  const breadcrumbItems = [
    { label: "Campus", href: "#" },
    { label: "Room Availability", href: "#" },
    { label: "Room 606 Management", active: true },
  ];

  return (
    <div className="w-full h-full flex flex-col space-y-8 max-w-7xl mx-auto p-6 md:p-8 bg-neutral">
      
      {/* Header Section */}
      <div className="space-y-2">
        <Breadcrumbs items={breadcrumbItems} />
        <h1 className="font-heading text-3xl font-bold text-secondary-dark tracking-tight">
          Room 606 Management
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

      {/* Devices Table Section */}
      <div className="w-full bg-white rounded-2xl shadow-sm p-8 border border-neutral-border">
        <ProvisionedDevicesTable />
      </div>

    </div>
  );
}
