import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { DoorOpen, MoreVertical } from 'lucide-react';
import { useMonitoring } from '../../../hooks/useMonitoring';
import { useMe } from '../../../features/auth/hooks';

const StatusBadge = ({ status }: { status: string }) => {
  const isAktif = ['aktif', 'active', 'ACTIVE', 'AKTIF'].includes(status.toLowerCase());
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${isAktif ? 'bg-green-100 text-green-800' : 'bg-neutral-border text-secondary-dark'}`}>
      {status}
    </span>
  );
};

export function DeviceStatusTable() {
  const { fetchDevices, updateDevice } = useMonitoring();
  const { data: userData } = useMe();
  const [devices, setDevices] = useState<any[]>([]);

  const role = userData?.user?.role;
  const isAdmin = role === 'admin';

  const loadDevices = () => {
    fetchDevices().then(res => {
      if (res.success && res.data) {
        setDevices(res.data);
      }
    });
  };

  useEffect(() => {
    loadDevices();
  }, [fetchDevices]);

  const handleToggle = async (id: string, currentStatus: string) => {
    if (!isAdmin) return;
    const newStatus = ['aktif', 'active', 'ACTIVE', 'AKTIF'].includes(currentStatus) ? 'nonaktif' : 'aktif';
    
    // Optimistic UI update
    setDevices(prev => prev.map(d => d.device_id === id ? { ...d, device_status: newStatus } : d));
    
    await updateDevice(id, { device_status: newStatus });
    loadDevices();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg text-black font-heading font-bold">Device Status by Room</CardTitle>
        <a href="#" className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors">View History</a>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-secondary font-bold uppercase tracking-wider border-b border-neutral-border">
              <tr>
                <th className="pb-3 px-4">Room</th>
                <th className="pb-3 px-4">Lighting</th>
                <th className="pb-3 px-4">AC Status</th>
                <th className="pb-3 px-4">Temp(°C)</th>
                <th className="pb-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border/50">
              {devices.map((device) => {
                const isLightActive = device.lighting === 'Active';
                const isAcActive = device.ac_status === 'Active';
                const isDeviceActive = ['aktif', 'active', 'ACTIVE', 'AKTIF'].includes(device.device_status);

                return (
                  <tr key={device.device_id} className="hover:bg-neutral/50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-black flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-neutral border border-neutral-border flex items-center justify-center text-secondary">
                        <DoorOpen size={16} />
                      </div>
                      {device.room_name}
                    </td>
                    <td className="py-4 px-4">
                      <div className={`flex items-center text-sm font-medium ${isLightActive ? 'text-primary-dark' : 'text-secondary-light'}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${isLightActive ? 'bg-primary' : 'bg-secondary-light'}`}></span>
                        {device.lighting}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className={`flex items-center text-sm font-medium ${isAcActive ? 'text-primary-dark' : 'text-secondary-light'}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${isAcActive ? 'bg-primary' : 'bg-secondary-light'}`}></span>
                        {device.ac_status}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-sm font-medium ${!isAcActive ? 'text-secondary-light' : 'text-primary-dark'}`}>
                        {isAcActive ? `${device.temperature}°C` : 'Off'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {isAdmin ? (
                          <>
                            {/* Toggle Switch */}
                            <button 
                              onClick={() => handleToggle(device.device_id, device.device_status)}
                              className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${isDeviceActive ? 'bg-primary-dark' : 'bg-neutral-border'}`}
                            >
                              <span 
                                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm ${isDeviceActive ? 'left-[22px]' : 'left-1'}`}
                              />
                            </button>
                            <button className="text-secondary hover:text-black transition-colors">
                              <MoreVertical size={16} />
                            </button>
                          </>
                        ) : (
                          <StatusBadge status={device.device_status} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {devices.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-secondary">
                    No devices registered
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
