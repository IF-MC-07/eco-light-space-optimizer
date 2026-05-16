import React, { useState } from "react";
import { Edit, UserMinus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import { useUsers } from "../hooks";
import { UserFilters } from "../types";

interface UserTableProps {
  filters?: UserFilters;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export function UserTable({ filters, onEdit, onRemove }: UserTableProps) {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useUsers({ ...filters, page, limit });
  const users = data?.data || [];
  const pagination = data?.pagination;
  const total = pagination?.total || 0;
  const totalPages = pagination?.totalPages || 1;

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return "bg-[#86EFAC] text-[#065F46]"; // Green
      case "MANAGER":
      case "EDITOR":
        return "bg-[#BFDBFE] text-[#1E3A8A]"; // Blue
      case "VIEWER":
      case "STUDENT":
        return "bg-[#E2E8F0] text-[#0F172A]"; // Gray
      default:
        return "bg-[#E2E8F0] text-[#0F172A]";
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-secondary-light">Loading users...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error loading users.</div>;
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="border-b border-neutral-border text-left">
              <th className="py-4 px-4 text-[10px] font-bold text-secondary-dark uppercase tracking-widest w-[35%]">User</th>
              <th className="py-4 px-4 text-[10px] font-bold text-secondary-dark uppercase tracking-widest w-[15%]">Role</th>
              <th className="py-4 px-4 text-[10px] font-bold text-secondary-dark uppercase tracking-widest w-[20%]">Department</th>
              <th className="py-4 px-4 text-[10px] font-bold text-secondary-dark uppercase tracking-widest w-[20%]">Last Active</th>
              <th className="py-4 px-4 text-[10px] font-bold text-secondary-dark uppercase tracking-widest text-right w-[10%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-secondary-light">No users found.</td>
              </tr>
            ) : (
              users.map((user, idx) => (
                <tr key={user.id || user.user_id || idx} className={cn("group transition-colors hover:bg-neutral-border/20", idx !== users.length - 1 && "border-b border-neutral-border/50")}>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-secondary-dark text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0">
                        {user.avatar || user.name?.substring(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-secondary-dark">{user.name}</h4>
                        <p className="text-[11px] text-secondary-light">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest inline-block",
                      getRoleBadgeColor(user.role)
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-xs font-semibold text-secondary-dark">{user.department || '-'}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-xs font-medium text-secondary-light">{user.lastActive || '-'}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      <button 
                        onClick={() => onEdit?.(user.id || String(user.user_id))}
                        className="text-secondary-light hover:text-secondary-dark transition-colors" 
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onRemove?.(user.id || String(user.user_id))}
                        className="text-[#DC2626]/70 hover:text-[#DC2626] transition-colors" 
                        title="Remove User"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {total > 0 && (
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between text-xs text-secondary-light">
          <p className="font-medium mb-4 md:mb-0">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
          </p>
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-neutral-border transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button 
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded font-bold transition-colors",
                  page === p 
                    ? "bg-primary-dark text-white" 
                    : "text-secondary-dark hover:bg-neutral-border"
                )}
              >
                {p}
              </button>
            ))}

            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-neutral-border transition-colors disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
