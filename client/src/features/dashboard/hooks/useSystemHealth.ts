import { useMemo } from 'react';
import { useCameraList } from '../../camera/hooks';
import { useOccupancy } from '../../occupancy/hooks';
import { useDevices } from '../../iot-device/hooks';
import { usePowerSensors } from '../../energy-monitor/hooks';
import { DETECTION_STALE_MINUTES, SENSOR_STALE_MINUTES } from '../constants';

export type HealthStatusType = 'normal' | 'warning' | 'error' | 'no_data';
export type HealthStatusLabel = 'Normal' | 'Warning' | 'Offline' | 'No data';

export interface HealthComponentItem {
  id: string;
  name: string;
  status: HealthStatusType;
  statusLabel: HealthStatusLabel;
  lastSeenText: string;
  helpText?: string;
  isIssue: boolean;
}

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

export function useSystemHealthStatus() {
  const { data: cameraData, isLoading: isCamLoading } = useCameraList();
  const { data: occupancyRes, isLoading: isOccLoading } = useOccupancy({ include_simulated: false });
  const { data: devicesRes, isLoading: isDevLoading } = useDevices();
  const { data: sensorsRes, isLoading: isSensorsLoading } = usePowerSensors();

  const isLoading = isCamLoading || isOccLoading || isDevLoading || isSensorsLoading;

  const components: HealthComponentItem[] = useMemo(() => {
    // Ruangan non-simulasi untuk cross-check deteksi
    const rooms = (occupancyRes?.data || []).filter((r: any) => !r.is_simulated);
    const roomMap = new Map<string, any>(rooms.map((r: any) => [String(r.room_id), r]));

    // 1. Kamera: Normal hanya bila aktif DAN data deteksi ruangannya segar
    const rawCameras = (cameraData as any)?.data || cameraData || [];
    const cameras = Array.isArray(rawCameras) ? rawCameras : [];
    let camComponent: HealthComponentItem;
    if (cameras.length === 0) {
      camComponent = {
        id: 'cameras',
        name: 'Surveillance Cameras',
        status: 'no_data',
        statusLabel: 'No data',
        lastSeenText: 'No cameras registered',
        isIssue: false,
      };
    } else {
      const inactive = cameras.filter((c: any) => {
        const s = (c.status || '').toLowerCase();
        return s !== 'aktif' && s !== 'active';
      });

      if (inactive.length > 0) {
        // Kamera nonaktif -> Mati
        camComponent = {
          id: 'cameras',
          name: 'Surveillance Cameras',
          status: 'error',
          statusLabel: 'Offline',
          lastSeenText: `${inactive.length} of ${cameras.length} cameras offline`,
          isIssue: true,
        };
      } else {
        // Semua kamera aktif, periksa kesegaran data deteksi ruangannya
        const cameraRoomIds = cameras.map((c: any) => String(c.room_id)).filter(Boolean);
        const cameraRooms = cameraRoomIds.map((id) => roomMap.get(id)).filter(Boolean);

        const timestamps = cameraRooms
          .map((r: any) => (r.updated_at ? new Date(r.updated_at).getTime() : 0))
          .filter((t: number) => !isNaN(t) && t > 0);

        if (timestamps.length === 0) {
          camComponent = {
            id: 'cameras',
            name: 'Surveillance Cameras',
            status: 'warning',
            statusLabel: 'Warning',
            lastSeenText: 'cameras active, no detection data yet',
            isIssue: true,
          };
        } else {
          const latestTimestamp = Math.max(...timestamps);
          const ageMinutes = Math.floor((Date.now() - latestTimestamp) / 60000);
          const isStale = ageMinutes > DETECTION_STALE_MINUTES;

          if (isStale) {
            // Kamera aktif tetapi deteksi basi -> Perhatian ("data deteksi {n} jam lalu")
            const relativeText = formatRelativeTime(new Date(latestTimestamp).toISOString());
            camComponent = {
              id: 'cameras',
              name: 'Surveillance Cameras',
              status: 'warning',
              statusLabel: 'Warning',
              lastSeenText: `detection data ${relativeText}`,
              isIssue: true,
            };
          } else {
            // Normal hanya bila aktif DAN deteksi ruangannya segar
            camComponent = {
              id: 'cameras',
              name: 'Surveillance Cameras',
              status: 'normal',
              statusLabel: 'Normal',
              lastSeenText: `${cameras.length} cameras active · fresh detection`,
              isIssue: false,
            };
          }
        }
      }
    }

    // 2. Layanan deteksi
    let detComponent: HealthComponentItem;
    if (rooms.length === 0) {
      detComponent = {
        id: 'detection',
        name: 'Occupancy Detection Service',
        status: 'no_data',
        statusLabel: 'No data',
        lastSeenText: 'No non-simulated rooms',
        isIssue: false,
      };
    } else {
      const timestamps = rooms
        .map((r: any) => (r.updated_at ? new Date(r.updated_at).getTime() : 0))
        .filter((t: number) => !isNaN(t) && t > 0);

      if (timestamps.length === 0) {
        detComponent = {
          id: 'detection',
          name: 'Occupancy Detection Service',
          status: 'no_data',
          statusLabel: 'No data',
          lastSeenText: 'No detection telemetry',
          isIssue: false,
        };
      } else {
        const latestTimestamp = Math.max(...timestamps);
        const ageMinutes = Math.floor((Date.now() - latestTimestamp) / 60000);
        const relativeText = formatRelativeTime(new Date(latestTimestamp).toISOString());
        const isStale = ageMinutes > DETECTION_STALE_MINUTES;
        detComponent = {
          id: 'detection',
          name: 'Occupancy Detection Service',
          status: isStale ? 'warning' : 'normal',
          statusLabel: isStale ? 'Warning' : 'Normal',
          lastSeenText: `Last seen ${relativeText}`,
          isIssue: isStale,
        };
      }
    }

    // 3. Kontroler ESP32
    const rawDevices = devicesRes?.data || [];
    const esp32Devices = rawDevices.filter((d: any) => (d.type || d.device_type || '').toUpperCase() === 'ESP32');
    const rawSensors = Array.isArray(sensorsRes) ? sensorsRes : (sensorsRes as any)?.data || [];
    let espComponent: HealthComponentItem;
    if (esp32Devices.length === 0) {
      espComponent = {
        id: 'esp32',
        name: 'ESP32 Controller',
        status: 'no_data',
        statusLabel: 'No data',
        lastSeenText: 'No controllers registered',
        helpText: 'based on last status message',
        isIssue: false,
      };
    } else {
      const offline = esp32Devices.filter((d: any) => (d.status || '').toLowerCase() === 'offline');
      
      // Pengecekan per kontroler ESP32: bila pembacaan sensor daya (read_at) di ruangan yang sama
      // lebih baru daripada last_seen ESP32, tampilkan sebagai "pembacaan daya terakhir"
      const controllerStatuses = esp32Devices.map((d: any) => {
        const espTime = d.last_seen ? new Date(d.last_seen).getTime() : 0;
        const roomId = String(d.room_id || '');
        const roomSensors = Array.isArray(rawSensors)
          ? rawSensors.filter((s: any) => String(s.room_id) === roomId)
          : [];
        const sensorTimestamps = roomSensors
          .map((s: any) => (s.read_at ? new Date(s.read_at).getTime() : 0))
          .filter((t: number) => !isNaN(t) && t > 0);
        const latestSensorTime = sensorTimestamps.length > 0 ? Math.max(...sensorTimestamps) : 0;

        const isNewer = latestSensorTime > espTime;
        return {
          time: isNewer ? latestSensorTime : espTime,
          isPowerReading: isNewer,
          isOffline: (d.status || '').toLowerCase() === 'offline',
        };
      });

      const validStatuses = controllerStatuses.filter((c) => c.time > 0);
      const latestStatus = validStatuses.length > 0
        ? validStatuses.reduce((prev, curr) => (curr.time > prev.time ? curr : prev))
        : null;

      let lastSeenText = 'Never connected';
      let isStale = true;

      if (latestStatus && latestStatus.time > 0) {
        const ageMinutes = Math.floor((Date.now() - latestStatus.time) / 60000);
        isStale = ageMinutes > SENSOR_STALE_MINUTES;
        const relativeText = formatRelativeTime(new Date(latestStatus.time).toISOString());

        if (latestStatus.isPowerReading) {
          lastSeenText = `Last power reading ${relativeText}`;
        } else {
          lastSeenText = `Last controller connection ${relativeText}`;
        }
      }

      // Jangan menyiratkan kontroler online bila hanya last_seen yang lama
      const isIssue = offline.length > 0 || isStale;
      const status: HealthStatusType = offline.length > 0 ? 'error' : isStale ? 'warning' : 'normal';
      const statusLabel: HealthStatusLabel = offline.length > 0 ? 'Offline' : isStale ? 'Warning' : 'Normal';

      if (offline.length > 0) {
        lastSeenText = `${offline.length} offline · ${lastSeenText}`;
      }

      espComponent = {
        id: 'esp32',
        name: 'ESP32 Controller',
        status,
        statusLabel,
        lastSeenText,
        helpText: 'based on last status message',
        isIssue,
      };
    }

    // 4. Sensor energi
    const sensors = sensorsRes || [];
    let sensorComponent: HealthComponentItem;
    if (sensors.length === 0) {
      sensorComponent = {
        id: 'sensors',
        name: 'Power Sensors (PZEM)',
        status: 'no_data',
        statusLabel: 'No data',
        lastSeenText: 'No sensor readings',
        isIssue: false,
      };
    } else {
      const timestamps = sensors
        .map((s: any) => (s.read_at ? new Date(s.read_at).getTime() : 0))
        .filter((t: number) => !isNaN(t) && t > 0);

      if (timestamps.length === 0) {
        sensorComponent = {
          id: 'sensors',
          name: 'Power Sensors (PZEM)',
          status: 'no_data',
          statusLabel: 'No data',
          lastSeenText: 'No sensor telemetry',
          isIssue: false,
        };
      } else {
        const latestTimestamp = Math.max(...timestamps);
        const ageMinutes = Math.floor((Date.now() - latestTimestamp) / 60000);
        const relativeText = formatRelativeTime(new Date(latestTimestamp).toISOString());
        const isStale = ageMinutes > SENSOR_STALE_MINUTES;
        sensorComponent = {
          id: 'sensors',
          name: 'Power Sensors (PZEM)',
          status: isStale ? 'warning' : 'normal',
          statusLabel: isStale ? 'Warning' : 'Normal',
          lastSeenText: `Last seen ${relativeText}`,
          isIssue: isStale,
        };
      }
    }

    return [camComponent, detComponent, espComponent, sensorComponent];
  }, [cameraData, occupancyRes, devicesRes, sensorsRes]);

  const activeAlertsCount = useMemo(() => {
    return components.filter((c) => c.isIssue).length;
  }, [components]);

  return {
    components,
    activeAlertsCount,
    isLoading,
  };
}
