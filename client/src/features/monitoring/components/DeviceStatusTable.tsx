import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { DoorOpen, MoreVertical, Lightbulb, Wind, Cpu, ShieldAlert } from 'lucide-react';
import { useMonitoring } from '../../../hooks/useMonitoring';
import { useDevices as useIotDevices } from '../../../features/iot-device/hooks';
import { usePowerSensors } from '../../../features/energy-monitor/hooks';
import { useMe } from '../../../features/auth/hooks';
import { serverAPI } from '../../../lib/api';

function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return 'No data';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs) || diffMs < 0) return 'Just now';
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

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
  const { data: iotDevicesRes } = useIotDevices();
  const { data: powerSensorsRes } = usePowerSensors();
  const [devices, setDevices] = useState<any[]>([]);

  const rawIotDevices = (iotDevicesRes as any)?.data || iotDevicesRes || [];
  const rawSensors = (powerSensorsRes as any)?.data || powerSensorsRes || [];
  const esp32Devices = Array.isArray(rawIotDevices)
    ? rawIotDevices.filter((d: any) => (d.type || d.device_type || '').toUpperCase() === 'ESP32')
    : [];

  // Pengecekan per kontroler ESP32: bila pembacaan sensor daya (read_at) di ruangan yang sama
  // lebih baru daripada last_seen ESP32, tampilkan waktu pembacaan itu sebagai "pembacaan daya terakhir"
  const controllerStatuses = esp32Devices.map((d: any) => {
    const espTime = d.last_seen ? new Date(d.last_seen).getTime() : 0;
    const espRoomId = String(d.room_id || '');
    const roomSensors = Array.isArray(rawSensors)
      ? rawSensors.filter((s: any) => String(s.room_id) === espRoomId)
      : [];
    const sensorTimestamps = roomSensors
      .map((s: any) => (s.read_at ? new Date(s.read_at).getTime() : 0))
      .filter((t: number) => !isNaN(t) && t > 0);
    const latestSensorTime = sensorTimestamps.length > 0 ? Math.max(...sensorTimestamps) : 0;

    const isPowerReading = latestSensorTime > espTime;
    const effectiveTime = isPowerReading ? latestSensorTime : espTime;

    return {
      deviceId: d.device_id,
      roomId: espRoomId,
      time: effectiveTime,
      isPowerReading,
      status: (d.status || '').toLowerCase(),
    };
  });

  const validStatuses = controllerStatuses.filter((c) => c.time > 0);
  const latestStatus = validStatuses.length > 0
    ? validStatuses.reduce((prev, curr) => (curr.time > prev.time ? curr : prev))
    : null;

  const ageMinutes = latestStatus?.time ? Math.floor((Date.now() - latestStatus.time) / 60000) : Infinity;
  // Jangan menyiratkan kontroler online bila hanya last_seen yang lama (> 30 menit)
  const isStale = ageMinutes > 30;
  const isOffline = latestStatus?.status === 'offline';
  const showWarning = isStale || isOffline;

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
    
    // Auto refresh every 5 seconds for real-time MQTT synchronization
    const interval = setInterval(loadDevices, 5000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const handleToggle = async (id: string, currentStatus: string) => {
    if (!isAdmin) return;
    const isCurrentlyActive = ['aktif', 'active', 'ACTIVE', 'AKTIF'].includes(currentStatus);
    const newStatus = isCurrentlyActive ? 'nonaktif' : 'aktif';
    const targetStatus = isCurrentlyActive ? 'off' : 'on';
    
    // Optimistic UI update: Toggle overall status AND all sub-controls (lights & AC) matching this position
    setDevices(prev => prev.map(d => {
      if (d.device_id === id) {
        const updatedLC = d.light_controls ? d.light_controls.map((lc: any) => ({
          ...lc,
          light_status: targetStatus
        })) : [];
        const updatedAC = d.ac_controls ? d.ac_controls.map((ac: any) => ({
          ...ac,
          ac_status: targetStatus
        })) : [];
        return {
          ...d,
          device_status: newStatus,
          light_controls: updatedLC,
          ac_controls: updatedAC,
          lighting: isCurrentlyActive ? 'Inactive' : 'Active',
          ac_status: isCurrentlyActive ? 'Inactive' : 'Active'
        };
      }
      return d;
    }));
    
    await updateDevice(id, { device_status: newStatus });
    loadDevices();
  };

  const handleLightToggle = async (controlId: string, currentStatus: string) => {
    if (!isAdmin) return;
    const isCurrentlyActive = ['on', 'active', 'ON', 'ACTIVE'].includes(currentStatus);
    const newStatus = isCurrentlyActive ? 'off' : 'on';

    // Optimistic UI update
    setDevices(prev => 
      prev.map(d => {
        if (d.light_controls) {
          const updatedLC = d.light_controls.map((lc: any) => 
            lc.control_id === controlId ? { ...lc, light_status: newStatus } : lc
          );
          const hasActive = updatedLC.some((lc: any) => ['on', 'active', 'ON', 'ACTIVE'].includes(lc.light_status));
          return {
            ...d,
            light_controls: updatedLC,
            lighting: hasActive ? 'Active' : 'Inactive',
            light_status: updatedLC[0]?.light_status || 'off'
          };
        }
        return d;
      })
    );

    try {
      await serverAPI.patch(`/light-controls/${controlId}/toggle`);
    } catch (err) {
      console.error("Failed to toggle light status", err);
    }
    loadDevices();
  };

  const handleAcToggle = async (acControlId: string, currentStatus: string) => {
    if (!isAdmin) return;
    const isCurrentlyActive = ['on', 'active', 'ON', 'ACTIVE'].includes(currentStatus);
    const newStatus = isCurrentlyActive ? 'off' : 'on';

    // Optimistic UI update
    setDevices(prev => 
      prev.map(d => {
        if (d.ac_controls) {
          const updatedAC = d.ac_controls.map((ac: any) => 
            ac.ac_control_id === acControlId ? { ...ac, ac_status: newStatus } : ac
          );
          const hasActive = updatedAC.some((ac: any) => ['on', 'active', 'ON', 'ACTIVE'].includes(ac.ac_status));
          return {
            ...d,
            ac_controls: updatedAC,
            ac_status: hasActive ? 'Active' : 'Inactive'
          };
        }
        return d;
      })
    );

    try {
      await serverAPI.patch(`/ac-controls/${acControlId}/toggle`);
    } catch (err) {
      console.error("Failed to toggle AC status", err);
    }
    loadDevices();
  };

  return (
    <Card className="border-none shadow-md overflow-hidden bg-white rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-neutral-border bg-neutral/20">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg text-black font-heading font-bold flex items-center gap-2">
            Device Status & Override Control
          </CardTitle>
          <p className="text-xs text-secondary-light">
            Real-time synchronization with ESP32 nodes over MQTT. Click individual components to override.
          </p>
        </div>
        {latestStatus && latestStatus.time > 0 && (
          <div className="flex flex-col items-end gap-0.5">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                showWarning
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${showWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
              ></span>
              <Cpu size={12} className={showWarning ? 'text-amber-600' : 'text-slate-600'} />
              <span>
                {latestStatus.isPowerReading
                  ? `Last power reading ${formatRelativeTime(new Date(latestStatus.time).toISOString())}`
                  : `Last controller connection ${formatRelativeTime(new Date(latestStatus.time).toISOString())}`}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 pr-2">
              based on last status message
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-secondary font-bold uppercase tracking-wider border-b border-neutral-border bg-neutral/10">
              <tr>
                <th className="py-3.5 px-6">Room</th>
                <th className="py-3.5 px-6">Lighting (Relay Control)</th>
                <th className="py-3.5 px-6">AC Status</th>
                <th className="py-3.5 px-6">Temp(°C)</th>
                <th className="py-3.5 px-6">Master Switch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border/50">
              {devices.map((device) => {
                const isLightActive = device.lighting === 'Active';
                const isAcActive = device.ac_status === 'Active';
                const isDeviceActive = ['aktif', 'active', 'ACTIVE', 'AKTIF'].includes(device.device_status);

                const rowStatus = controllerStatuses.find(
                  (c) => String(c.deviceId) === String(device.device_id) || (device.room_id && String(c.roomId) === String(device.room_id))
                );
                const rowTimingText = rowStatus && rowStatus.time > 0
                  ? `${rowStatus.isPowerReading ? 'Last power reading' : 'Last connected'} ${formatRelativeTime(new Date(rowStatus.time).toISOString())}`
                  : null;

                return (
                  <tr key={device.device_id} className="hover:bg-neutral/30 transition-colors">
                    <td className="py-5 px-6 font-semibold text-black flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral border border-neutral-border flex items-center justify-center text-secondary-dark shadow-sm">
                        <DoorOpen size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{device.room_name}</span>
                        <span className="text-[10px] text-secondary-light font-mono font-medium">{device.device_id}</span>
                        {rowTimingText && (
                          <span className="text-[10px] text-slate-400 mt-0.5">{rowTimingText}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex flex-wrap gap-2.5">
                        {device.light_controls && device.light_controls.length > 0 ? (
                          [...device.light_controls]
                            .sort((a: any, b: any) => (a.relay_channel || 0) - (b.relay_channel || 0))
                            .map((lc: any) => {
                            const isActive = ['on', 'active', 'ON', 'ACTIVE'].includes(lc.light_status);
                            return (
                              <button
                                key={lc.control_id}
                                disabled={!isAdmin}
                                onClick={() => handleLightToggle(lc.control_id, lc.light_status)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-200 ${
                                  isActive
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.15)] hover:bg-amber-500/20'
                                    : 'bg-[#F8FAFC] border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                } ${!isAdmin ? 'cursor-not-allowed opacity-75' : 'cursor-pointer active:scale-95'}`}
                                title={isAdmin ? `Click to turn ${isActive ? 'OFF' : 'ON'}` : undefined}
                              >
                                <Lightbulb 
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                    isActive ? 'fill-amber-500 text-amber-500 scale-110' : 'text-slate-400'
                                  }`} 
                                />
                                <span>Relay {lc.relay_channel}</span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-100 bg-[#F8FAFC] text-slate-400 text-xs font-semibold">
                            <ShieldAlert size={14} className="text-slate-400" />
                            <span>No Relay Mapped</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center">
                        {device.ac_controls && device.ac_controls.length > 0 ? (
                          device.ac_controls.map((ac: any) => {
                            const isActive = ['on', 'active', 'ON', 'ACTIVE'].includes(ac.ac_status);
                            return (
                              <button
                                key={ac.ac_control_id}
                                disabled={!isAdmin}
                                onClick={() => handleAcToggle(ac.ac_control_id, ac.ac_status)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-200 ${
                                  isActive
                                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600 shadow-[0_0_8px_rgba(6,182,212,0.15)] hover:bg-cyan-500/20'
                                    : 'bg-[#F8FAFC] border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                } ${!isAdmin ? 'cursor-not-allowed opacity-75' : 'cursor-pointer active:scale-95'}`}
                                title={isAdmin ? `Click to turn ${isActive ? 'OFF' : 'ON'}` : undefined}
                              >
                                <Wind 
                                  className={`w-3.5 h-3.5 ${
                                    isActive ? 'animate-spin text-cyan-500 scale-110' : 'text-slate-400'
                                  }`} 
                                  style={isActive ? { animationDuration: '3s' } : undefined}
                                />
                                <span>AC: {isActive ? 'ON' : 'OFF'}</span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-100 bg-[#F8FAFC] text-slate-400 text-xs font-semibold">
                            <ShieldAlert size={14} className="text-slate-400" />
                            <span>No AC Mapped</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`text-sm font-bold font-mono px-2 py-1 rounded bg-[#F8FAFC] border border-slate-100 ${!isAcActive ? 'text-slate-400' : 'text-cyan-600'}`}>
                        {isAcActive ? `${device.temperature}°C` : 'Off'}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        {isAdmin ? (
                          <>
                            {/* Toggle Switch */}
                            <button 
                              onClick={() => handleToggle(device.device_id, device.device_status)}
                              className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${isDeviceActive ? 'bg-[#10B981]' : 'bg-slate-300'}`}
                            >
                              <span 
                                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-md ${isDeviceActive ? 'left-[23px]' : 'left-1'}`}
                              />
                            </button>
                            <button className="text-slate-400 hover:text-slate-600 transition-colors">
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
                  <td colSpan={5} className="py-10 text-center text-slate-400 font-semibold">
                    No devices registered. Add devices via the Room Management page.
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
