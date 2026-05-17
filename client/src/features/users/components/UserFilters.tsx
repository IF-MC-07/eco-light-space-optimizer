import React, { useState, useEffect } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import type { UserFilters as UserFiltersType } from "../types";

interface UserFiltersProps {
  onFilterChange?: (filters: UserFiltersType) => void;
}

export function UserFilters({ onFilterChange }: UserFiltersProps) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  const handleApplyFilters = () => {
    if (onFilterChange) {
      const filters: UserFiltersType = {};
      if (search) filters.search = search;
      if (role) filters.role = role;
      onFilterChange(filters);
    }
  };

  // Optional: Auto-apply search when typing, with debounce, or just rely on the filter button
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleApplyFilters();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, role]);

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 w-full">
      {/* Search Bar */}
      <div className="relative flex-1 w-full">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-light pointer-events-none">
          <Search className="w-4 h-4" />
        </div>
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full bg-[#E2E8F0] bg-opacity-60 border-none rounded-xl text-sm font-semibold text-secondary-dark placeholder-secondary-light focus:outline-none focus:ring-2 focus:ring-primary/50 pl-11 pr-4 py-3"
        />
      </div>

      {/* Role Dropdown */}
      <div className="relative w-full md:w-auto min-w-[140px]">
        <select 
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full bg-[#E2E8F0] bg-opacity-60 border-none rounded-xl text-xs font-bold text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 pl-4 pr-10 py-3 appearance-none cursor-pointer"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="mahasiswa">Mahasiswa</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-dark pointer-events-none">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {/* Filter Button */}
      <button 
        onClick={handleApplyFilters}
        className="w-full md:w-auto h-[44px] px-4 bg-[#E2E8F0] bg-opacity-60 hover:bg-opacity-100 rounded-xl flex items-center justify-center text-secondary-dark transition-colors shrink-0"
      >
        <Filter className="w-4 h-4" />
      </button>
    </div>
  );
}
