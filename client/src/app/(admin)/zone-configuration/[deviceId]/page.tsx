import ZoneConfiguration from '@/components/pages/admin/ZoneConfiguration';

export default function ZoneConfigurationPage() {
  return <ZoneConfiguration />;
}

export async function generateStaticParams() {
  try {
    const { iotDeviceApi } = await import('../../../../features/iot-device/api');
    const response = await iotDeviceApi.getAll();
    const devices = response.data || [];
    
    return devices.map((device: any) => ({
      deviceId: device.device_id?.toString() || device.id?.toString(),
    }));
  } catch (error) {
    console.warn("Could not fetch devices for static generation. Fallback to default.", error);
    return [{ deviceId: '1' }];
  }
}
