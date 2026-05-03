import React from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { cn } from "../../../lib/utils";

interface RoomStatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBgClass?: string;
  iconColorClass?: string;
  watermarkIcon?: React.ReactNode;
  isLive?: boolean;
}

export function RoomStatCard({
  title,
  value,
  icon,
  iconBgClass = "bg-[#D1FAE5]",
  iconColorClass = "text-primary-dark",
  watermarkIcon,
  isLive,
}: RoomStatCardProps) {
  return (
    <Card className="relative overflow-hidden border-none shadow-sm bg-[#F5F7F5] h-[140px] flex flex-col justify-between">
      <CardContent className="p-6 h-full flex flex-col justify-between relative z-10">
        <div className="flex justify-between items-start">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              iconBgClass,
              iconColorClass
            )}
          >
            {icon}
          </div>
          {isLive && (
            <span className="text-[10px] font-bold text-primary tracking-widest uppercase bg-white/50 px-2 py-1 rounded-sm">
              LIVE
            </span>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-secondary-light tracking-wide mb-1">
            {title}
          </p>
          <h3 className="font-heading text-2xl font-bold text-secondary-dark tracking-tight leading-none">
            {value}
          </h3>
        </div>
      </CardContent>

      {/* Watermark Icon */}
      {watermarkIcon && (
        <div className="absolute -bottom-4 -right-4 text-secondary-light/10 pointer-events-none">
          {watermarkIcon}
        </div>
      )}
    </Card>
  );
}
