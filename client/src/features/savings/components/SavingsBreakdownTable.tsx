import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Snowflake, Lightbulb, Refrigerator, MonitorSmartphone } from 'lucide-react';

const breakdownData = [
  { 
    category: 'HVAC System', 
    energy: '840 kWh', 
    saved: '$142.20', 
    status: 'OPTIMIZED',
    icon: Snowflake 
  },
  { 
    category: 'Smart Lighting', 
    energy: '320 kWh', 
    saved: '$84.30', 
    status: 'OPTIMIZED',
    icon: Lightbulb
  },
  { 
    category: 'Appliances', 
    energy: '210 kWh', 
    saved: '$12.10', 
    status: 'CHECK UP',
    icon: Refrigerator
  },
  { 
    category: 'Others', 
    energy: '82 kWh', 
    saved: '$45.90', 
    status: 'OPTIMIZED',
    icon: MonitorSmartphone
  },
];

export function SavingsBreakdownTable() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-black">Savings Breakdown by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-secondary font-bold uppercase tracking-wider border-b border-neutral-border">
            <tr>
              <th className="pb-3 px-2">Category</th>
              <th className="pb-3 px-2">Energy Used</th>
              <th className="pb-3 px-2">Saved</th>
              <th className="pb-3 px-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-border/50">
            {breakdownData.map((row, i) => (
              <tr key={i}>
                <td className="py-4 px-2 font-medium text-secondary-dark flex items-center">
                  <row.icon className={`w-4 h-4 mr-3 ${row.status === 'OPTIMIZED' ? 'text-primary' : 'text-tertiary'}`} />
                  {row.category}
                </td>
                <td className="py-4 px-2 text-secondary">{row.energy}</td>
                <td className="py-4 px-2 font-bold text-primary">{row.saved}</td>
                <td className="py-4 px-2 text-right">
                  <Badge 
                    className={row.status === 'OPTIMIZED' 
                      ? 'bg-primary/10 text-primary hover:bg-primary/20 border-transparent font-bold' 
                      : 'bg-tertiary/10 text-tertiary hover:bg-tertiary/20 border-transparent font-bold'}
                  >
                    {row.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
