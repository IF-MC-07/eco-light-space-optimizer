import React from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Leaf } from "lucide-react";

export function EcoScore() {
  return (
    <Card className="h-full bg-primary-dark text-white border-none shadow-none overflow-hidden relative">
      <CardContent className="p-6 h-full flex flex-col justify-between">
        {/* Large faded leaf in background - typical for modern minimal UI */}
        <div className="absolute -right-4 -top-4 opacity-10">
          <Leaf size={120} strokeWidth={1} />
        </div>

        <div>
          <h3 className="font-heading text-lg font-bold">Eco Score</h3>
          <p className="text-primary-light text-xs mt-1">Building optimization level</p>
        </div>

        <div className="flex items-baseline space-x-2 mt-8">
          <span className="font-heading text-5xl font-bold tracking-tight">A+</span>
          <span className="text-sm font-medium text-primary-light">Excellent</span>
        </div>
      </CardContent>
    </Card>
  );
}
