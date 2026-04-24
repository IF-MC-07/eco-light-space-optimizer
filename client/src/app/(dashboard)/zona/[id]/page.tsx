"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useKontrol } from '@/hooks/useKontrol';
import { useParams } from 'next/navigation';

export default function ZonaDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toggleLampu } = useKontrol();

  const fetchDetail = () => {
    api.get(`/zona/${id}/detail`).then(res => {
      setData(res.data.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleToggle = async (id_lampu: number) => {
    await toggleLampu(id_lampu);
    fetchDetail();
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-secondary-dark">Detail Zona: {data?.nama_zona}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">Log Deteksi Terbaru</h3>
          {data?.log_deteksi ? (
            <div>
              <p>Waktu: {new Date(data.log_deteksi.waktu_deteksi).toLocaleString()}</p>
              <p>Jumlah Orang: {data.log_deteksi.jumlah_orang}</p>
            </div>
          ) : (
            <p>Belum ada deteksi.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">Kontrol Lampu</h3>
          {data?.kontrol_lampu && data.kontrol_lampu.length > 0 ? (
            <ul className="space-y-4">
              {data.kontrol_lampu.map((lampu: any) => (
                <li key={lampu.id_kontrol_lampu} className="flex justify-between items-center">
                  <span>Perangkat ID: {lampu.id_perangkat}</span>
                  <button 
                    className={`px-4 py-2 rounded text-white ${lampu.status_lampu === 'on' ? 'bg-green-500' : 'bg-gray-400'}`}
                    onClick={() => handleToggle(lampu.id_kontrol_lampu)}
                  >
                    {lampu.status_lampu === 'on' ? 'Matikan Lampu' : 'Nyalakan Lampu'}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Tidak ada lampu terdaftar di zona ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}
