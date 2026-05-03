import React from "react";
import { Edit, UserMinus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  department: string;
  lastActive: string;
  avatar: string;
}

const mockUsers: UserData[] = [
  { id: "1", name: "Elena Vance", email: "elena.vance@ecolight.io", role: "ADMIN", department: "Sustainability", lastActive: "2 mins ago", avatar: "EV" },
  { id: "2", name: "Mark Baird", email: "m.baird@ecolight.io", role: "EDITOR", department: "Operations", lastActive: "1 hour ago", avatar: "MB" },
  { id: "3", name: "Sasha Aris", email: "s.aris@ecolight.io", role: "VIEWER", department: "Maintenance", lastActive: "Yesterday", avatar: "SA" },
  { id: "4", name: "James Cobel", email: "j.cobel@ecolight.io", role: "ADMIN", department: "Campus IT", lastActive: "3 days ago", avatar: "JC" },
];

export function UserTable() {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-[#86EFAC] text-[#065F46]"; // Green
      case "EDITOR":
        return "bg-[#BFDBFE] text-[#1E3A8A]"; // Blue
      case "VIEWER":
        return "bg-[#E2E8F0] text-[#0F172A]"; // Gray
      default:
        return "bg-[#E2E8F0] text-[#0F172A]";
    }
  };

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
            {mockUsers.map((user, idx) => (
              <tr key={user.id} className={cn("group transition-colors hover:bg-neutral-border/20", idx !== mockUsers.length - 1 && "border-b border-neutral-border/50")}>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-dark text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0">
                      {/* Placeholder for avatar image */}
                      {user.avatar}
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
                  <span className="text-xs font-semibold text-secondary-dark">{user.department}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-xs font-medium text-secondary-light">{user.lastActive}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end space-x-3">
                    <button className="text-secondary-light hover:text-secondary-dark transition-colors" title="Edit User">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-[#DC2626]/70 hover:text-[#DC2626] transition-colors" title="Remove User">
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="mt-8 flex flex-col md:flex-row items-center justify-between text-xs text-secondary-light">
        <p className="font-medium mb-4 md:mb-0">Showing 1 to 4 of 1,284 users</p>
        <div className="flex items-center space-x-1">
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-neutral-border transition-colors disabled:opacity-50" disabled>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded bg-primary-dark text-white font-bold transition-colors">
            1
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded text-secondary-dark font-bold hover:bg-neutral-border transition-colors">
            2
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded text-secondary-dark font-bold hover:bg-neutral-border transition-colors">
            3
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-neutral-border transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
