import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';

export function YoYComparison() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-black">YoY Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-secondary-dark">Energy Consumption</span>
            <span className="text-sm font-bold text-primary">-18.4%</span>
          </div>
          <Progress value={81.6} indicatorColor="bg-primary" />
        </div>
        
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-secondary-dark">Monthly Cost</span>
            <span className="text-sm font-bold text-primary">-12.2%</span>
          </div>
          <Progress value={87.8} indicatorColor="bg-primary" />
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-secondary-dark">Active Devices</span>
            <span className="text-sm font-bold text-tertiary">+5.0%</span>
          </div>
          <Progress value={100} indicatorColor="bg-tertiary" />
        </div>

        <div className="pt-4 mt-2">
          <p className="text-xs leading-relaxed text-secondary italic">
            "You are currently saving more energy than 92% of users in your region. Keep up the optimization!"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
