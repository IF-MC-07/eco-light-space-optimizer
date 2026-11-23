"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Activity, Clock, LogIn, LogOut, UserCheck, Shield } from 'lucide-react';
import { useActivityLogList } from '../hooks';

function formatRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();

  if (isNaN(diffMs) || diffMs < 0) return 'Baru saja';

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} mnt lalu`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

function isJsonString(str: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  );
}

function cleanDetailsText(details: string): string {
  if (!details || isJsonString(details)) return '';
  return details;
}

function getActivityDetails(log: any) {
  const action = (log.action || '').trim();
  const rawDetails = (log.details || '').trim();
  const cleanDetails = cleanDetailsText(rawDetails);
  const userName = log.User?.name || log.User?.username || 'Sistem';

  // Peristiwa Khusus Perangkat
  if (action === 'DEVICE_ONLINE') {
    return {
      title: 'Perangkat Terhubung',
      description: cleanDetails || `${userName} menghubungkan perangkat IoT`,
      icon: <Activity className="w-4 h-4 text-emerald-600" />,
      bgClass: 'bg-emerald-50',
    };
  }

  if (action === 'DEVICE_OFFLINE') {
    return {
      title: 'Perangkat Terputus',
      description: cleanDetails || `${userName} memutuskan perangkat IoT`,
      icon: <Activity className="w-4 h-4 text-slate-500" />,
      bgClass: 'bg-slate-100',
    };
  }

  // Peristiwa Autentikasi
  const lowerAction = action.toLowerCase();
  if (
    lowerAction.includes('auth') ||
    action === 'Created Auth' ||
    action.startsWith('POST /auth') ||
    action.startsWith('POST /api/auth')
  ) {
    if (lowerAction.includes('login') || action.includes('/login')) {
      return {
        title: 'Login Berhasil',
        description: `${userName} berhasil masuk ke sistem`,
        icon: <LogIn className="w-4 h-4 text-blue-600" />,
        bgClass: 'bg-blue-50',
      };
    }
    if (lowerAction.includes('logout') || action.includes('/logout')) {
      return {
        title: 'Logout',
        description: `${userName} keluar dari sistem`,
        icon: <LogOut className="w-4 h-4 text-slate-600" />,
        bgClass: 'bg-slate-100',
      };
    }
    if (lowerAction.includes('register') || action.includes('/register')) {
      return {
        title: 'Pendaftaran Akun',
        description: `Pendaftaran akun baru oleh ${userName}`,
        icon: <UserCheck className="w-4 h-4 text-emerald-600" />,
        bgClass: 'bg-emerald-50',
      };
    }
    return {
      title: 'Autentikasi Pengguna',
      description: cleanDetails || `Sesi autentikasi oleh ${userName}`,
      icon: <Shield className="w-4 h-4 text-blue-600" />,
      bgClass: 'bg-blue-50',
    };
  }

  // REST API Actions (POST, PUT, DELETE, GET, PATCH + endpoint)
  const parts = action.split(' ');
  const method = parts[0]?.toUpperCase();
  const endpoint = parts[1] || '';

  if (['POST', 'PUT', 'DELETE', 'GET', 'PATCH'].includes(method) && endpoint) {
    const rawSegments = endpoint.split('?')[0].split('/').filter(Boolean);
    const resourceSegment = (rawSegments[0] === 'api' ? rawSegments[1] : rawSegments[0]) || 'sistem';
    const methodVerb =
      method === 'POST'
        ? 'Tambah'
        : method === 'PUT' || method === 'PATCH'
        ? 'Perbarui'
        : method === 'DELETE'
        ? 'Hapus'
        : 'Akses';

    return {
      title: `${methodVerb} ${resourceSegment}`,
      description: cleanDetails || `${userName} melakukan ${methodVerb.toLowerCase()} pada ${resourceSegment}`,
      icon: <Clock className="w-4 h-4 text-slate-600" />,
      bgClass: 'bg-slate-100',
    };
  }

  // Entri tak dikenali: "Aktivitas sistem"
  return {
    title: 'Aktivitas sistem',
    description: cleanDetails || `${action ? `${action} oleh ` : ''}${userName}`,
    icon: <Activity className="w-4 h-4 text-slate-600" />,
    bgClass: 'bg-slate-100',
  };
}

export function ActivityFeed() {
  const { data: activityLogs, isLoading } = useActivityLogList();

  return (
    <Card className="border-transparent shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6">
        <CardTitle className="text-sm font-bold text-black">Aktivitas Terbaru</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {isLoading ? (
          <div className="py-6 text-center text-sm text-secondary">
            Memuat aktivitas terbaru...
          </div>
        ) : !activityLogs || activityLogs.length === 0 ? (
          <div className="py-6 text-center text-sm text-secondary">
            Belum ada log aktivitas.
          </div>
        ) : (
          <div className="space-y-5 max-h-80 overflow-y-auto pr-1">
            {activityLogs.slice(0, 10).map((log: any) => {
              const item = getActivityDetails(log);
              return (
                <div key={log.log_id} className="flex items-start gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.bgClass}`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black mb-0.5 truncate">{item.title}</p>
                    <p className="text-xs text-secondary truncate">{item.description}</p>
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
