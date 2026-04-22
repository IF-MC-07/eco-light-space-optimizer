import React from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Progress } from "../../../components/ui/Progress";

export function SystemHealth() {
  return (
    <Card className="h-full border-none shadow-none">
      <CardContent className="p-6 h-full flex flex-col justify-between space-y-6">
        <h3 className="font-heading text-xs font-bold text-secondary-light uppercase tracking-wider">
          System Health
        </h3>

        <div className="space-y-2 flex-1">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-secondary-dark font-body">AC Efficiency</span>
            <span className="font-bold text-secondary-dark">92%</span>
          </div>
          <Progress value={92} indicatorColor="bg-primary-dark" className="h-[6px]" />
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-secondary-dark font-body">Light Optimization</span>
            <span className="font-bold text-secondary-dark">78%</span>
          </div>
          <Progress value={78} indicatorColor="bg-primary-dark" className="h-[6px]" />
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-secondary-dark font-body">Grid Stability</span>
            <span className="font-bold text-secondary-dark">98%</span>
          </div>
          <Progress value={98} indicatorColor="bg-primary-dark" className="h-[6px]" />
        </div>
      </CardContent>
    </Card>
  );
}
