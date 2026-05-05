"use client";
import React from "react";
import { UserPlus } from "lucide-react";
import { Breadcrumbs } from "../../../components/ui/Breadcrumbs";
import { Button } from "../../../components/ui/Button";
import { UserStatCard } from "../../../features/users/components/UserStatCard";
import { UserFilters } from "../../../features/users/components/UserFilters";
import { UserTable } from "../../../features/users/components/UserTable";

export default function UserManagement() {
  const breadcrumbItems = [
    { label: "Campus Management", href: "#" },
    { label: "User Management", active: true },
  ];

  return (
    <div className="w-full h-full flex flex-col space-y-8 max-w-7xl mx-auto p-6 md:p-8 bg-neutral min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="font-heading text-3xl font-bold text-secondary-dark tracking-tight">
            User Management
          </h1>
        </div>
        <Button className="bg-primary-dark hover:bg-primary text-white text-sm py-2 px-4 h-11 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </Button>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <UserStatCard
          title="Total Users"
          value="1,284"
          subtext="+12%"
          statusColor="green"
        />
        <UserStatCard
          title="Active Admins"
          value="42"
          subtext="Steady"
          statusColor="gray"
        />
        <UserStatCard
          title="Pending Invites"
          value="18"
          subtext="Urgent"
          statusColor="red"
        />
        <UserStatCard
          title="Dept. Coverage"
          value="94%"
          subtext="Excellent"
          statusColor="green"
        />
      </div>

      {/* Main Content Area */}
      <div className="w-full bg-white rounded-3xl shadow-sm border border-neutral-border p-6 md:p-8 space-y-8">
        <UserFilters />
        <UserTable />
      </div>

    </div>
  );
}
