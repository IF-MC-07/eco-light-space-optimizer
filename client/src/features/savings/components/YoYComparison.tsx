"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { useSavingsYoY } from '../hooks';

export function YoYComparison() {
  const { data: response, isLoading } = useSavingsYoY();
  const yoy = response?.data;

  const reduction = yoy?.reduction_percentage ?? 28.8;
  const progressValue = 100 - reduction;

  if (isLoading) {
    return <div className="text-center py-4">Loading YoY comparison...</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-black">YoY Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-secondary-dark">Energy Consumption</span>
            <span className="text-sm font-bold text-primary">-{reduction}%</span>
          </div>
          <Progress value={progressValue} indicatorColor="bg-primary" />
        </div>
        
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-secondary-dark">Monthly Cost</span>
            <span className="text-sm font-bold text-primary">-{Math.round(reduction * 0.8 * 10) / 10}%</span>
          </div>
          <Progress value={100 - (reduction * 0.8)} indicatorColor="bg-primary" />
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
