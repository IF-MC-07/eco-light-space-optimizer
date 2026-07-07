import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useActivityLogList } from '../hooks';

function formatRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  
  if (isNaN(diffMs) || diffMs < 0) return "Just now";
  
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} mins ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export function ActivityFeed() {
  const { data: activityLogs, isLoading } = useActivityLogList();

  const getAlertDetails = (log: any) => {
    const action = log.action || '';
    const details = log.details || '';
    const name = log.User?.name || 'System';

    if (action === 'DEVICE_ONLINE') {
      return {
        title: 'Device Connected',
        description: details || 'An IoT device has connected to the network.',
        icon: <CheckCircle2 className="w-4 h-4 text-primary" />,
        bgClass: 'bg-primary/10',
      };
    }

    if (action === 'DEVICE_OFFLINE') {
      return {
        title: 'Device Disconnected',
        description: details || 'An IoT device has disconnected from the network.',
        icon: <AlertCircle className="w-4 h-4 text-tertiary" />,
        bgClass: 'bg-tertiary/10',
      };
    }

    if (action.startsWith('POST')) {
      const path = action.split(' ')[1] || '';
      const resource = path.split('/')[2] || 'item';
      return {
        title: `Created ${resource.charAt(0).toUpperCase() + resource.slice(1)}`,
        description: `${name} created a new ${resource}.`,
        icon: <CheckCircle2 className="w-4 h-4 text-primary" />,
        bgClass: 'bg-primary/10',
      };
    }

    if (action.startsWith('PUT')) {
      const path = action.split(' ')[1] || '';
      const resource = path.split('/')[2] || 'item';
      return {
        title: `Updated ${resource.charAt(0).toUpperCase() + resource.slice(1)}`,
        description: `${name} updated a ${resource}.`,
        icon: <Clock className="w-4 h-4 text-blue-600" />,
        bgClass: 'bg-blue-50',
      };
    }

    if (action.startsWith('DELETE')) {
      const path = action.split(' ')[1] || '';
      const resource = path.split('/')[2] || 'item';
      return {
        title: `Deleted ${resource.charAt(0).toUpperCase() + resource.slice(1)}`,
        description: `${name} deleted a ${resource}.`,
        icon: <AlertCircle className="w-4 h-4 text-tertiary" />,
        bgClass: 'bg-tertiary/10',
      };
    }

    // Default fallback
    return {
      title: 'System Activity',
      description: details || action,
      icon: <Clock className="w-4 h-4 text-blue-600" />,
      bgClass: 'bg-blue-50',
    };
  };

  return (
    <Card className="border-transparent shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-sm font-bold text-black">Recent System Alerts</CardTitle>
        <a href="#" className="text-xs font-bold text-primary hover:text-primary-dark transition-colors">
          View History
        </a>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-sm text-secondary">
            Loading recent alerts...
          </div>
        ) : !activityLogs || activityLogs.length === 0 ? (
          <div className="py-6 text-center text-sm text-secondary">
            No recent activity logs available.
          </div>
        ) : (
          <div className="space-y-6 max-h-80 overflow-y-auto pr-1">
            {activityLogs.slice(0, 10).map((log: any) => {
              const alert = getAlertDetails(log);
              return (
                <div key={log.log_id} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${alert.bgClass}`}>
                    {alert.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black mb-0.5 truncate">{alert.title}</p>
                    <p className="text-xs text-secondary truncate">{alert.description}</p>
                  </div>
                  <div className="text-[11px] text-secondary-light font-medium whitespace-nowrap">
                    {formatRelativeTime(log.timestamp)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
