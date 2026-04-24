"use client";
import { useEffect, useState } from 'react';
import { useMonitoring } from '@/hooks/useMonitoring';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function MonitoringPage() {
  const { fetchEnergi, fetchSensor, loading } = useMonitoring();
  const [energiData, setEnergiData] = useState<any[]>([]);
  const [sensorData, setSensorData] = useState<any[]>([]);

  useEffect(() => {
    fetchEnergi().then(res => setEnergiData(res.data || []));
    fetchSensor().then(res => setSensorData(res.data || []));
  }, [fetchEnergi, fetchSensor]);

  const chartData = {
    labels: sensorData.map(d => new Date(d.waktu_pencatatan).toLocaleTimeString()),
    datasets: [
      {
        label: 'Daya (W)',
        data: sensorData.map(d => parseFloat(d.daya)),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-secondary-dark">Monitoring Energi & Sensor</h1>
      {loading ? <p>Loading...</p> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-4">Grafik Sensor Daya Terbaru</h3>
            {sensorData.length > 0 ? (
              <Line data={chartData} />
            ) : (
              <p>Tidak ada data sensor.</p>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow overflow-auto">
            <h3 className="font-bold text-lg mb-4">Log Energi</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Ruangan</th>
                  <th className="py-2">Energi Digunakan</th>
                  <th className="py-2">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {energiData.map(e => (
                  <tr key={e.id_log_energi} className="border-b">
                    <td className="py-2">{e.ruangan?.nama_ruangan}</td>
                    <td className="py-2">{e.energi_digunakan} kWh</td>
                    <td className="py-2">{new Date(e.waktu_mulai).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
