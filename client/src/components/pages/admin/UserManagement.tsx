"use client";
import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { Breadcrumbs } from "../../../components/ui/Breadcrumbs";
import { Button } from "../../../components/ui/Button";
import { UserStatCard } from "../../../features/users/components/UserStatCard";
import { UserFilters } from "../../../features/users/components/UserFilters";
import { UserTable } from "../../../features/users/components/UserTable";
import { AddUserModal } from "../../../features/users/components/AddUserModal";
import { EditUserModal } from "../../../features/users/components/EditUserModal";
import { RemoveUserModal } from "../../../features/users/components/RemoveUserModal";
import { ExportReportModal } from "../../../features/dashboard/components/ExportReportModal";

export default function UserManagement() {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isRemoveUserOpen, setIsRemoveUserOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [filters, setFilters] = useState({});

  const breadcrumbItems = [
    { label: "Campus Management", href: "#" },
    { label: "User Management", active: true },
  ];

  const handleEdit = (id: string) => {
    setSelectedUserId(id);
    setIsEditUserOpen(true);
  };

  const handleRemove = (id: string) => {
    setSelectedUserId(id);
    setIsRemoveUserOpen(true);
  };

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
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary"
            onClick={() => setIsExportModalOpen(true)}
            className="bg-white border-2 border-secondary-dark/10 text-secondary-dark font-bold h-11 px-6 rounded-xl shadow-sm hover:border-secondary-dark hover:bg-secondary-dark hover:text-white transition-all flex items-center gap-2"
          >
            Export Users
          </Button>
          <Button 
            onClick={() => setIsAddUserOpen(true)}
            className="bg-primary-dark hover:bg-primary text-white text-sm py-2 px-4 h-11 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <UserStatCard
          title="Total Users"
          statKey="totalUsers"
          subtext="+12%"
          statusColor="green"
        />
        <UserStatCard
          title="Active Admins"
          statKey="adminCount"
          subtext="Steady"
          statusColor="gray"
        />
        <UserStatCard
          title="Active Users"
          statKey="activeUsers"
          subtext="Urgent"
          statusColor="red"
        />
        <UserStatCard
          title="New This Month"
          statKey="newThisMonth"
          subtext="Excellent"
          statusColor="green"
        />
      </div>

      {/* Main Content Area */}
      <div className="w-full bg-white rounded-3xl shadow-sm border border-neutral-border p-6 md:p-8 space-y-8">
        <UserFilters onFilterChange={setFilters} />
        <UserTable filters={filters} onEdit={handleEdit} onRemove={handleRemove} />
      </div>

      {/* Modals */}
      <AddUserModal 
        isOpen={isAddUserOpen} 
        onClose={() => setIsAddUserOpen(false)} 
      />
      
      <EditUserModal 
        isOpen={isEditUserOpen} 
        onClose={() => setIsEditUserOpen(false)} 
        userId={selectedUserId || ""}
      />

      <RemoveUserModal 
        isOpen={isRemoveUserOpen} 
        onClose={() => setIsRemoveUserOpen(false)}
        userName={selectedUserId ? "Selected User" : ""} // Ideally you'd fetch the user data
      />

      <ExportReportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        reportType="users"
      />

    </div>
  );
}
