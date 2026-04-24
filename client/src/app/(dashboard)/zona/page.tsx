"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';

export default function ZonaPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/zona').then(res => {
      setData(res.data.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-secondary-dark">Daftar Zona</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((z) => (
            <div key={z.id_zona} className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-lg text-primary">{z.nama_zona}</h3>
              <Link href={`/zona/${z.id_zona}`}>
                <span className="text-blue-500 mt-4 block hover:underline cursor-pointer">Lihat Detail</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
