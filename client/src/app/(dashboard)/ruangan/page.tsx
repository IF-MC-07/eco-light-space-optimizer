"use client";
import { useRuangan } from '@/hooks/useRuangan';

export default function RuanganPage() {
  const { data, loading, error, deleteRuangan } = useRuangan();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-secondary-dark">Manajemen Ruangan</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Nama Ruangan</th>
                <th className="py-2">Kapasitas</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id_ruangan} className="border-b">
                  <td className="py-2">{r.nama_ruangan}</td>
                  <td className="py-2">{r.kapasitas}</td>
                  <td className="py-2">
                    <button 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => deleteRuangan(r.id_ruangan)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
