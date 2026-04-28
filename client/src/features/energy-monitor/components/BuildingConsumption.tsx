import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';

export function BuildingConsumption() {
  const buildings = [
    { id: 'A', name: 'Main Research Wing', value: 142.4, max: 200 },
    { id: 'B', name: 'Data Commons', value: 108.1, max: 200 },
    { id: 'C', name: 'Administrative Hub', value: 65.8, max: 200 },
    { id: 'D', name: 'Botanical Labs', value: 103.7, max: 200 },
  ];

  return (
    <Card className="border-transparent shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-lg text-black font-heading font-bold">Consumption by Building</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-8 space-y-6">
        {buildings.map((building) => (
          <div key={building.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-[#F1F5F9] text-primary-dark font-bold text-xs flex items-center justify-center">
                  {building.id}
                </div>
                <span className="text-sm font-bold text-black">{building.name}</span>
              </div>
              <span className="text-xs font-bold text-black">{building.value} kWh</span>
            </div>
            <Progress 
              value={(building.value / building.max) * 100} 
              indicatorColor="bg-primary-dark" 
              className="h-2 bg-[#E2E8F0]" 
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
