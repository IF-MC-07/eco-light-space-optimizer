import React from "react";
import { cn } from "../../../lib/utils";

interface UserStatCardProps {
  title: string;
  value: string;
  subtext?: string;
  statusColor?: "green" | "red" | "gray";
}

export function UserStatCard({
  title,
  value,
  subtext,
  statusColor = "gray",
}: UserStatCardProps) {
  const getStatusColor = () => {
    switch (statusColor) {
      case "green":
        return "text-[#059669]"; // emerald-600
      case "red":
        return "text-[#DC2626]"; // red-600
      case "gray":
      default:
        return "text-secondary-light"; // standard muted text
    }
  };

  return (
    <div className="bg-[#F8FAFC] rounded-2xl p-6 flex flex-col justify-between h-full border border-neutral-border/40 shadow-sm">
      <h3 className="text-xs font-bold text-secondary-dark tracking-wide mb-2">
        {title}
      </h3>
      <div className="flex items-baseline space-x-2">
        <span className="font-heading text-4xl font-bold text-secondary-dark tracking-tight">
          {value}
        </span>
        {subtext && (
          <span className={cn("text-[10px] font-bold uppercase tracking-widest", getStatusColor())}>
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}
