import React from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { cn } from "../../../lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  iconBgClass?: string;
  iconColorClass?: string;
  trend?: "up" | "down" | "neutral";
  trendColorClass?: string;
  leftBorderClass?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBgClass = "bg-primary/10",
  iconColorClass = "text-primary",
  trend,
  trendColorClass = "text-secondary-light",
  leftBorderClass,
}: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", leftBorderClass && `border-l-4 ${leftBorderClass}`)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div
                className={cn(
                  "p-3 rounded-lg flex items-center justify-center",
                  iconBgClass,
                  iconColorClass
                )}
              >
                {icon}
              </div>
              <p className="text-xs font-bold uppercase text-secondary-light tracking-wider">
                {title}
              </p>
            </div>
            
            <div>
              <h3 className="font-heading text-3xl font-bold text-secondary-dark font-sans tracking-tight">
                {value}
              </h3>
              <p className={cn("text-xs mt-1 font-medium", trendColorClass)}>
                {trend === "up" && "↗ "}
                {trend === "down" && "↘ "}
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
