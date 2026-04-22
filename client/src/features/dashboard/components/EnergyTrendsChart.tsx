import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "../../../components/ui/Card";
import { cn } from "../../../lib/utils";

const dataDay = [
  { time: "08:00 AM", value: 30 },
  { time: "10:00 AM", value: 45 },
  { time: "12:00 PM", value: 40 },
  { time: "02:00 PM", value: 25 },
  { time: "04:00 PM", value: 60 },
  { time: "06:00 PM", value: 35 },
];

const dataWeek = [
  { time: "Mon", value: 300 },
  { time: "Tue", value: 450 },
  { time: "Wed", value: 400 },
  { time: "Thu", value: 250 },
  { time: "Fri", value: 600 },
  { time: "Sat", value: 350 },
  { time: "Sun", value: 200 },
];

const dataMonth = [
  { time: "Week 1", value: 1200 },
  { time: "Week 2", value: 1450 },
  { time: "Week 3", value: 1100 },
  { time: "Week 4", value: 1600 },
];

export function EnergyTrendsChart() {
  const [timeRange, setTimeRange] = useState<"Day" | "Week" | "Month">("Day");

  const data = timeRange === "Day" ? dataDay : timeRange === "Week" ? dataWeek : dataMonth;

  return (
    <Card className="h-full border-none shadow-none bg-[#F5F7F5]">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-heading text-lg font-bold text-secondary-dark">Energy Usage Trends</h3>
            <p className="text-sm text-secondary-light mt-1">Consumption across all zones {timeRange === "Day" ? "today" : timeRange === "Week" ? "this week" : "this month"}</p>
          </div>
          <div className="flex bg-[#E2E8F0] p-1 rounded-md">
            {(["Day", "Week", "Month"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-4 py-1 text-xs font-semibold rounded-md transition-colors",
                  timeRange === range
                    ? "bg-white text-secondary-dark shadow-sm"
                    : "text-secondary-light hover:text-secondary-dark"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-grow w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1E293B', 
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '12px'
                }}
                itemStyle={{ color: 'white' }}
                cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#1B4D1E" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                activeDot={{ r: 6, fill: '#1B4D1E', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
