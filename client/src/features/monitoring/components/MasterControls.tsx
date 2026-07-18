import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Power, AlertOctagon, ChevronRight } from 'lucide-react';
import { useMonitoring } from '../../../hooks/useMonitoring';

export function MasterControls() {
  const { postMasterControl } = useMonitoring();

  const handleAction = async (action: string) => {
    await postMasterControl(action);
    alert(`${action === 'kill_all' ? 'Kill All Power' : 'Turn on All'} executed successfully!`);
  };

  return (
    <Card className="bg-[#E2E8F0]/30 border-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-black font-heading font-bold">Master Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <button 
          onClick={() => handleAction('turn_on')}
          className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-border hover:border-primary/30 transition-all shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#bbf7d0] text-primary flex items-center justify-center">
              <Power size={18} />
            </div>
            <span className="text-sm font-bold text-black group-hover:text-primary transition-colors">Turn On All The Device</span>
          </div>
          <ChevronRight size={18} className="text-secondary" />
        </button>

        <button 
          onClick={() => handleAction('kill_all')}
          className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-border hover:border-tertiary/30 transition-all shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-tertiary/10 text-tertiary flex items-center justify-center">
              <Power size={18} />
            </div>
            <span className="text-sm font-bold text-black group-hover:text-tertiary transition-colors">Kill All Power</span>
          </div>
          <ChevronRight size={18} className="text-secondary" />
        </button>
      </CardContent>
    </Card>
  );
}
