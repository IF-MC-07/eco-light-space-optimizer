import React, { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Sun, Expand, Thermometer, Pencil, ChevronDown } from 'lucide-react';

export function ActiveRulesList() {
  const [rules, setRules] = useState([
    {
      id: 1,
      name: 'Morning Ambience',
      status: 'ACTIVE',
      trigger: '07:00 AM daily',
      action: 'Gradient lights to 40%',
      icon: Sun,
      enabled: true,
    },
    {
      id: 2,
      name: 'Hallway Auto-Off',
      status: 'ACTIVE',
      trigger: 'No motion for 5 mins',
      action: 'Power off Hallway AC',
      icon: Expand,
      enabled: true,
    },
    {
      id: 3,
      name: 'Peak Hour Saver',
      status: 'PAUSED',
      trigger: 'Energy cost > $0.15/kWh',
      action: 'Set AC to 26°C',
      icon: Thermometer,
      enabled: false,
    }
  ]);

  const toggleRule = (id: number) => {
    setRules(rules.map(rule => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-heading font-bold text-black">Active Rules</h2>
        <div className="flex items-center text-xs font-bold text-secondary uppercase tracking-wider">
          SORT BY: <span className="ml-2 text-primary-dark cursor-pointer flex items-center">Most Frequent <ChevronDown size={14} className="ml-1" /></span>
        </div>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="border border-neutral-border shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-md bg-neutral flex items-center justify-center text-secondary shrink-0 border border-neutral-border/60">
                  <rule.icon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-bold text-black">{rule.name}</h3>
                    <Badge 
                      className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border-transparent ${
                        rule.status === 'ACTIVE' ? 'bg-[#bbf7d0] text-primary' : 'bg-tertiary/10 text-tertiary'
                      }`}
                    >
                      {rule.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-secondary font-medium">
                    Trigger: {rule.trigger} <span className="mx-1">•</span> Action: {rule.action}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleRule(rule.id)}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${rule.enabled ? 'bg-primary-dark' : 'bg-neutral-border'}`}
                >
                  <span 
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm ${rule.enabled ? 'left-[26px]' : 'left-1'}`}
                  />
                </button>
                <button className="text-secondary hover:text-black transition-colors p-2">
                  <Pencil size={16} />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
