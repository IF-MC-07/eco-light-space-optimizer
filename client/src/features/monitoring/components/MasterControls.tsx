"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Power, AlertTriangle, ChevronRight, CheckCircle2, XCircle, X } from 'lucide-react';
import { useMonitoring } from '../../../hooks/useMonitoring';
import { useRooms } from '../../rooms/hooks';

interface ExecutionResultItem {
  roomId: string | number;
  roomName: string;
  success: boolean;
  message?: string;
  hasAc?: boolean;
  statusText: string;
}

export function MasterControls() {
  const { fetchDevices, updateDevice } = useMonitoring();
  const { data: roomsRes } = useRooms();

  const [devices, setDevices] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<ExecutionResultItem[] | null>(null);

  useEffect(() => {
    fetchDevices().then((res) => {
      if (res.success && res.data) {
        setDevices(res.data);
      }
    });
  }, [fetchDevices]);

  // Hanya ruangan non-simulasi
  const allRooms = (roomsRes as any)?.data || roomsRes || [];
  const nonSimRooms = Array.isArray(allRooms) ? allRooms.filter((r: any) => !r.is_simulated) : [];
  const nonSimRoomIds = new Set(nonSimRooms.map((r: any) => String(r.room_id)));

  // Perangkat milik ruangan non-simulasi
  const affectedDevices = devices.filter((d: any) => {
    const rId = String(d.room_id || d.Room?.room_id || '');
    return nonSimRoomIds.has(rId);
  });

  const handleKillAllExecute = async () => {
    setIsExecuting(true);
    const results: ExecutionResultItem[] = [];

    // Kelompokkan perangkat per ruangan
    const devicesByRoom = new Map<string, any[]>();
    for (const dev of affectedDevices) {
      const rId = String(dev.room_id || dev.Room?.room_id || '');
      if (!devicesByRoom.has(rId)) devicesByRoom.set(rId, []);
      devicesByRoom.get(rId)!.push(dev);
    }

    for (const room of nonSimRooms) {
      const rId = String(room.room_id);
      const roomDevs = devicesByRoom.get(rId) || [];

      if (roomDevs.length === 0) {
        results.push({
          roomId: room.room_id,
          roomName: room.room_name,
          success: true,
          hasAc: false,
          statusText: 'Perintah terkirim',
          message: 'Tidak ada perangkat aktif',
        });
        continue;
      }

      let roomSuccess = true;
      let failureReason = '';
      let hasAcDevice = false;

      for (const dev of roomDevs) {
        const isAc = (dev.ac_controls && dev.ac_controls.length > 0) || (dev.type || '').toUpperCase() === 'AC';
        if (isAc) hasAcDevice = true;

        try {
          const res = await updateDevice(dev.device_id, { device_status: 'nonaktif' });
          if (!res?.success) {
            roomSuccess = false;
            failureReason = res?.message || 'Gagal merespons';
          }
        } catch (err: any) {
          roomSuccess = false;
          failureReason = err?.message || 'Koneksi terputus';
        }
      }

      const statusText = !roomSuccess
        ? 'Gagal'
        : hasAcDevice
        ? 'Perintah terkirim, tanpa konfirmasi perangkat'
        : 'Perintah terkirim';

      results.push({
        roomId: room.room_id,
        roomName: room.room_name,
        success: roomSuccess,
        hasAc: hasAcDevice,
        statusText,
        message: roomSuccess
          ? (hasAcDevice ? 'Perintah matikan daya dikirim (AC tanpa konfirmasi)' : 'Perintah matikan relay dikirim ke broker')
          : failureReason,
      });
    }

    setIsExecuting(false);
    setShowConfirmModal(false);
    setExecutionResults(results);

    // Refresh devices setelah eksekusi
    fetchDevices().then((res) => {
      if (res.success && res.data) setDevices(res.data);
    });
  };

  return (
    <>
      <Card className="bg-[#E2E8F0]/30 border-transparent shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-black font-heading font-bold">Master Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Turn On All - Dinonaktifkan karena belum tersambung ke endpoint backend */}
          <button
            type="button"
            disabled
            className="w-full flex items-center justify-between p-3 bg-white/70 rounded-lg border border-neutral-border opacity-50 cursor-not-allowed shadow-none"
            title="Belum tersambung ke backend"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center">
                <Power size={18} />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-slate-500 block">Turn On All The Device</span>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Belum tersambung</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </button>

          {/* Kill All Power - Hanya Ruangan Non-Simulasi */}
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-border hover:border-red-400/50 hover:bg-red-50/20 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                <Power size={18} />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-black group-hover:text-red-700 transition-colors block">
                  Kill All Power
                </span>
                <span className="text-[11px] text-secondary">
                  {nonSimRooms.length} ruangan non-simulasi
                </span>
              </div>
            </div>
            <ChevronRight size={18} className="text-secondary group-hover:text-red-600 transition-colors" />
          </button>
        </CardContent>
      </Card>

      {/* Modal Konfirmasi Kill All Power */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-border animate-in fade-in zoom-in duration-150">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-black font-heading">Konfirmasi Kill All Power</h3>
                <p className="text-xs text-red-600 font-semibold mt-1">
                  Peringatan: Tindakan ini akan mematikan seluruh perangkat lampu dan AC pada semua ruangan non-simulasi.
                </p>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  Status relay dan AC tidak dikonfirmasi oleh perangkat.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 text-xs text-slate-700 space-y-1">
              <div className="flex justify-between font-medium">
                <span>Ruangan terdampak:</span>
                <span className="font-bold text-black">{nonSimRooms.length} ruangan non-simulasi</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Perangkat terdampak:</span>
                <span className="font-bold text-black">{affectedDevices.length} perangkat IoT</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isExecuting}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-secondary-dark hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isExecuting}
                onClick={handleKillAllExecute}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isExecuting ? 'Memproses...' : 'Ya, Matikan Semua Daya'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hasil Eksekusi per Ruangan */}
      {executionResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-neutral-border animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border mb-4">
              <h3 className="text-base font-bold text-black font-heading">Hasil Eksekusi Kill All Power</h3>
              <button
                type="button"
                onClick={() => setExecutionResults(null)}
                className="text-slate-400 hover:text-black transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 mb-6">
              {executionResults.map((res: ExecutionResultItem) => (
                <div
                  key={res.roomId}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    res.success ? 'bg-green-50/70 border-green-200' : 'bg-red-50/70 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {res.success ? (
                      <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-red-600 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-black">{res.roomName}</p>
                      <p className="text-[11px] text-secondary mt-0.5">{res.message}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      res.success ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {res.statusText}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setExecutionResults(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-primary-dark hover:bg-primary rounded-xl transition-colors shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
