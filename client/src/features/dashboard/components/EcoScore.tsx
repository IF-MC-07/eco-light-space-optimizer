import React from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Leaf } from "lucide-react";
import { useDashboard } from "../../../hooks/useDashboard";

export function EcoScore() {
  const { data } = useDashboard();

  const lightsTotal = data?.lights_total || 0;
  const lightsActive = data?.lights_active || 0;

  const activeRatio = lightsTotal > 0 ? (lightsActive / lightsTotal) : 0;
  const score = Math.min(100, Math.round(80 + (1 - activeRatio) * 20));

  let grade = "A+";
  let desc = "Excellent";
  if (score >= 95) {
    grade = "A+";
    desc = "Excellent";
  } else if (score >= 90) {
    grade = "A";
    desc = "Optimal";
  } else if (score >= 80) {
    grade = "B+";
    desc = "Good";
  } else {
    grade = "B";
    desc = "Moderate";
  }

  return (
    <Card className="h-full bg-primary-dark text-white border-none shadow-none overflow-hidden relative">
      <CardContent className="p-6 h-full flex flex-col justify-between min-h-[180px]">
        {/* Large faded leaf in background - typical for modern minimal UI */}
        <div className="absolute -right-4 -top-4 opacity-10">
          <Leaf size={120} strokeWidth={1} />
        </div>

        <div> 
          <h3 className="font-heading text-lg font-bold">Eco Score</h3>
          <p className="text-primary-light text-xs mt-1">Building optimization level</p>
        </div>

        <div className="flex items-baseline space-x-2 mt-8">
          <span className="font-heading text-5xl font-bold tracking-tight">{grade}</span>
          <span className="text-sm font-medium text-primary-light">{desc}</span>
        </div>
      </CardContent>
    </Card>
  );
}
