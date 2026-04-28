import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';

export function KeyAchievements() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-black">Key Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-5">
          <li className="flex items-start">
            <span className="mt-1.5 mr-3 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
            <p className="text-sm text-secondary-dark leading-snug">
              Reached <span className="font-semibold text-black">100 consecutive days</span> of eco-mode active during peak hours.
            </p>
          </li>
          <li className="flex items-start">
            <span className="mt-1.5 mr-3 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
            <p className="text-sm text-secondary-dark leading-snug">
              Reduced standby power by <span className="font-semibold text-black">24%</span> through smart scheduling.
            </p>
          </li>
          <li className="flex items-start">
            <span className="mt-1.5 mr-3 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
            <p className="text-sm text-secondary-dark leading-snug">
              Saved enough energy to power a laptop for <span className="font-semibold text-black">3,200 hours</span>.
            </p>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
