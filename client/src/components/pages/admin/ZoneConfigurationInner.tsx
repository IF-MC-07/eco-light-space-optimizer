"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Layout } from '../../layout/Layout';
import { Button } from '../../ui/Button';
import { 
  ChevronDown, Move, Eye, Trash2, 
  MousePointer2, Info, History, Plus, Database 
} from 'lucide-react';
import { useZona } from '../../../features/zona/hooks/useZona';
import type { Canvas, Rect } from 'fabric';
import { formatDistanceToNow } from 'date-fns';

export default function ZoneConfiguration() {
  const [selectedCameraId, setSelectedCameraId] = useState<number>(1);
  const [mode, setMode] = useState<'draw' | 'edit' | 'preview'>('edit');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const fabricModuleRef = useRef<typeof import('fabric') | null>(null);
  const [fabricLoaded, setFabricLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const originX = useRef(0);
  const originY = useRef(0);
  const tempRect = useRef<Rect | null>(null);
  const selectedIdRef = useRef<number | null>(null);
  const [timeAgo, setTimeAgo] = useState('Belum disimpan');

  const {
    zonas,
    selectedId,
    isSaving,
    lastSaved,
    addZona,
    updateZona,
    deleteZona,
    selectZona,
    clearAll,
    saveAll
  } = useZona(selectedCameraId);

  // Load fabric client-side and initialize the canvas only in the browser
  useEffect(() => {
    let isMounted = true;

    if (fabricModuleRef.current) {
      setFabricLoaded(true);
      return;
    }

    import('fabric')
      .then((fabricModule) => {
        if (!isMounted) return;
        fabricModuleRef.current = fabricModule;
        setFabricLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load fabric in browser:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Track selectedId without triggering re-renders
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // Initializing Fabric Canvas
  useEffect(() => {
    if (!fabricLoaded || !canvasRef.current || !containerRef.current) return;

    const fabric = fabricModuleRef.current?.fabric;
    if (!fabric) return;

    // We set dimensions based on 16:9 ratio of container width
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = (containerWidth * 9) / 16;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: containerWidth,
      height: containerHeight,
      selection: false
    });
    
    fabricRef.current = canvas;

    // Load background
    // Removed because background is now an <img> tag

    const handleResize = () => {
      if (!containerRef.current || !fabricRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = (newWidth * 9) / 16;
      fabricRef.current.setWidth(newWidth);
      fabricRef.current.setHeight(newHeight);
      // Background re-scale would be needed here for production robustness
      fabricRef.current.renderAll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas?.dispose();
    };
  }, [fabricLoaded, selectedCameraId]);

  // Sync state to Canvas
  useEffect(() => {
    if (!fabricLoaded || !fabricRef.current) return;
    const fabric = fabricModuleRef.current?.fabric;
    if (!fabric) return;

    const canvas = fabricRef.current;

    // Keep track of which zones exist on canvas
    const existingObjects = canvas.getObjects('rect');
    
    // Clear old rects/texts
    canvas.clear();
    // Reapply background (since clear removes it)
    // Removed because background is now an <img> tag

    const cw = canvas.getWidth();
    const ch = canvas.getHeight();

    zonas.forEach(z => {
      const rect = new fabric.Rect({
        left: z.x1_pct * cw,
        top: z.y1_pct * ch,
        width: (z.x2_pct - z.x1_pct) * cw,
        height: (z.y2_pct - z.y1_pct) * ch,
        fill: `${z.warna}33`, // 20% opacity hex
        stroke: z.warna,
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        cornerColor: z.warna,
        cornerSize: 8,
        transparentCorners: false,
        selectable: mode === 'edit',
        evented: mode === 'edit',
        lockRotation: true,
        data: { id: z.id_zona }
      });

      canvas.add(rect);

      // Add label
      const text = new fabric.Text(`${z.nama_zona} | x:${Math.round(z.x1_pct * 1920)}, y:${Math.round(z.y1_pct * 1080)}${mode==='preview'?' | Orang: ?':''}`, {
        left: z.x1_pct * cw,
        top: (z.y1_pct * ch) - 20,
        fontSize: 12,
        backgroundColor: z.warna,
        fill: '#fff',
        selectable: false,
        evented: false
      });
      canvas.add(text);
    });

    canvas.renderAll();

    // Restore active object after recreation so dragging doesn't lose selection
    if (mode === 'edit' && selectedIdRef.current !== null) {
       const activeObj = canvas.getObjects('rect').find(o => o.data?.id === selectedIdRef.current);
       if (activeObj) {
          canvas.setActiveObject(activeObj);
          canvas.renderAll();
       }
    }
  }, [zonas, mode, selectedCameraId]);

  // Handle Mouse Events for Drawing and Selecting
  useEffect(() => {
    if (!fabricLoaded || !fabricRef.current) return;
    const fabric = fabricModuleRef.current?.fabric;
    if (!fabric) return;

    const canvas = fabricRef.current;

    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
    canvas.off('object:modified');
    canvas.off('selection:created');
    canvas.off('selection:updated');
    canvas.off('selection:cleared');

    if (mode === 'draw') {
      canvas.defaultCursor = 'crosshair';
      canvas.on('mouse:down', (o) => {
        isDrawing.current = true;
        const pointer = canvas.getPointer(o.e);
        originX.current = pointer.x;
        originY.current = pointer.y;

        tempRect.current = new fabric.Rect({
          left: originX.current,
          top: originY.current,
          width: 0,
          height: 0,
          fill: 'rgba(76, 175, 80, 0.2)',
          stroke: '#4CAF50',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: false
        });
        canvas.add(tempRect.current);
      });

      canvas.on('mouse:move', (o) => {
        if (!isDrawing.current || !tempRect.current) return;
        const pointer = canvas.getPointer(o.e);

        if (originX.current > pointer.x) {
          tempRect.current.set({ left: abs(pointer.x) });
        }
        if (originY.current > pointer.y) {
          tempRect.current.set({ top: abs(pointer.y) });
        }

        tempRect.current.set({ width: Math.abs(originX.current - pointer.x) });
        tempRect.current.set({ height: Math.abs(originY.current - pointer.y) });
        canvas.renderAll();
      });

      canvas.on('mouse:up', () => {
        isDrawing.current = false;
        if (tempRect.current) {
          const cw = canvas.getWidth();
          const ch = canvas.getHeight();
          const left = tempRect.current.left || 0;
          const top = tempRect.current.top || 0;
          const width = tempRect.current.width || 0;
          const height = tempRect.current.height || 0;

          // Only add if it's large enough
          if (width > 10 && height > 10) {
            addZona({
              nama_zona: `Zona ${zonas.length + 1}`,
              x1_pct: left / cw,
              y1_pct: top / ch,
              x2_pct: (left + width) / cw,
              y2_pct: (top + height) / ch,
              warna: '#4CAF50'
            });
          }
          canvas.remove(tempRect.current);
          tempRect.current = null;
        }
        setMode('edit'); // switch back to edit mode automatically
      });
    } else if (mode === 'edit') {
      canvas.defaultCursor = 'default';
      
      const handleSelection = (e: any) => {
        const selectedObj = e.selected?.[0];
        if (selectedObj && selectedObj.data?.id) {
          selectZona(selectedObj.data.id);
        }
      };

      canvas.on('selection:created', handleSelection);
      canvas.on('selection:updated', handleSelection);
      canvas.on('selection:cleared', () => selectZona(-1)); // -1 or null

      canvas.on('object:modified', (e) => {
        const obj = e.target;
        if (!obj || !obj.data?.id) return;
        
        const cw = canvas.getWidth();
        const ch = canvas.getHeight();
        
        const scaleX = obj.scaleX || 1;
        const scaleY = obj.scaleY || 1;
        const left = obj.left || 0;
        const top = obj.top || 0;
        const width = (obj.width || 0) * scaleX;
        const height = (obj.height || 0) * scaleY;

        updateZona(obj.data.id, {
          x1_pct: left / cw,
          y1_pct: top / ch,
          x2_pct: (left + width) / cw,
          y2_pct: (top + height) / ch
        });

        // reset scale so resizing works predictably next time
        obj.set({ width: width, height: height, scaleX: 1, scaleY: 1 });
      });
    } else {
      canvas.defaultCursor = 'default';
      canvas.discardActiveObject();
    }

  }, [mode, addZona, selectZona, updateZona, zonas.length]);

  // Handle Last Saved Time
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSaved) {
        setTimeAgo(`Terakhir diubah: ${formatDistanceToNow(lastSaved, { addSuffix: true })}`);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [lastSaved]);

  const abs = Math.abs;

  const handleClearAll = () => {
    if (confirm('Yakin ingin menghapus semua zona?')) {
      clearAll();
    }
  };

  const selectedZonaData = zonas.find(z => z.id_zona === selectedId);

  return (
    <Layout navbarTitle="Zone Configuration" searchPlaceholder="Search systems...">
      <div className="max-w-[1400px] mx-auto w-full pb-10">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-[28px] font-heading font-extrabold text-neutral-900 mb-2 leading-none">
              Konfigurasi Zona Deteksi
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#E8F5E9] text-primary rounded-full text-xs font-bold shadow-sm">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                Live Preview
              </div>
              <span className="text-secondary text-sm font-medium">Res: 1920x1080</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="bg-white border border-neutral-border rounded-md px-3 py-2 flex items-center gap-3 cursor-pointer hover:border-neutral-muted shadow-sm">
               <span className="text-sm font-bold text-secondary-dark leading-none">Living Room</span>
               <ChevronDown size={14} className="text-secondary-light" />
             </div>
             <div className="bg-white border border-neutral-border rounded-md px-3 py-2 flex items-center gap-3 cursor-pointer hover:border-neutral-muted shadow-sm">
               <select 
                 className="text-sm font-bold text-secondary-dark leading-none outline-none appearance-none bg-transparent"
                 value={selectedCameraId}
                 onChange={(e) => setSelectedCameraId(Number(e.target.value))}
               >
                 <option value={1}>CCTV North-Entrance-01</option>
                 <option value={2}>CCTV Main-Lobby-02</option>
               </select>
               <ChevronDown size={14} className="text-secondary-light" />
             </div>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column (Image Area & Toolbars) - 3 Columns */}
          <div className="lg:col-span-3 flex flex-col">
            
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center bg-[#E2E8F0]/30 p-1 rounded-lg">
                <button 
                  onClick={() => setMode('draw')}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-sm font-bold border-transparent transition-all ${mode === 'draw' ? 'bg-white text-primary' : 'text-secondary hover:text-secondary-dark'}`}
                >
                  <div className="flex items-center justify-center">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  Gambar Zona
                </button>
                <button 
                  onClick={() => setMode('edit')}
                  className={`flex items-center gap-2.5 px-5 py-2 text-sm font-bold rounded-md transition-colors ${mode === 'edit' ? 'bg-white text-primary shadow-[0_1px_3px_rgba(0,0,0,0.05)]' : 'text-secondary hover:text-secondary-dark'}`}
                >
                  <Move size={16} /> Pindah / Ubah
                </button>
                <button 
                  onClick={() => setMode('preview')}
                  className={`flex items-center gap-2.5 px-5 py-2 text-sm font-bold rounded-md transition-colors ${mode === 'preview' ? 'bg-white text-primary shadow-[0_1px_3px_rgba(0,0,0,0.05)]' : 'text-secondary hover:text-secondary-dark'}`}
                >
                  <Eye size={16} /> Preview Inferensi
                </button>
              </div>

              <button 
                onClick={handleClearAll}
                className="flex items-center gap-2 text-tertiary px-4 py-2 text-sm font-bold hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 size={16} /> Hapus Semua
              </button>
            </div>

            {/* Canvas / Image Area */}
            <div ref={containerRef} className="relative w-full bg-[#0F172A] rounded-2xl overflow-hidden shadow-elevated border border-neutral-border border-opacity-50 min-h-[400px]">
               {/* Stream Background */}
               <img 
                 key={selectedCameraId}
                 src={`http://localhost:8000/kamera/${selectedCameraId}/stream`}
                 className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                 alt="Camera Stream"
               />

               {/* Fabric overlay */}
               <div className={`relative w-full h-full z-10 ${mode === 'preview' ? 'hidden' : 'block'}`}>
                 <canvas ref={canvasRef} />
               </div>
               
               {mode === 'draw' && (
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-5 py-3 rounded-lg flex items-center gap-3 text-sm font-semibold border border-white/10 shadow-2xl z-20 pointer-events-none">
                   <MousePointer2 size={18} className="text-white/80" /> 
                   <span>Klik dan seret untuk menggambar zona baru</span>
                 </div>
               )}
            </div>

            {/* Canvas Footer */}
            <div className="flex items-center gap-6 mt-3 px-2 text-[11px] font-bold text-secondary-light">
              <div className="flex items-center gap-1.5 hover:text-secondary cursor-default transition-colors">
                 <Info size={14} /> Koordinat berdasarkan resolusi 1920x1080
              </div>
              <div className="flex items-center gap-1.5 hover:text-secondary cursor-default transition-colors">
                 <History size={14} /> {timeAgo}
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar Configuration Panels) - 1 Column */}
          <div className="lg:col-span-1 flex flex-col gap-8 bg-[#F8FAFC] p-6 rounded-2xl border border-neutral-border/50">
            
            {/* Panel: Daftar Zona */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-neutral-900 text-sm">Daftar Zona</h3>
                <span className="px-2 py-1 bg-[#E2E8F0] text-secondary-dark font-extrabold text-[9px] rounded uppercase tracking-widest">{zonas.length} Total</span>
              </div>

              <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-2">
                {zonas.map(z => (
                  <div 
                    key={z.id_zona}
                    onClick={() => selectZona(z.id_zona!)}
                    className={`flex items-center justify-between p-3.5 bg-white border-2 rounded-lg cursor-pointer transition-colors shadow-sm ${selectedId === z.id_zona ? 'border-[#2E7D32] shadow-[0_2px_8px_rgba(46,125,50,0.1)]' : 'border-transparent hover:border-neutral-border'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.warna }}></div>
                      <span className={`text-sm font-semibold ${selectedId === z.id_zona ? 'text-[#1B4D1E] font-bold' : 'text-secondary-dark'}`}>{z.nama_zona}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteZona(z.id_zona!); }}
                      className="text-secondary-light hover:text-tertiary transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Zone Button */}
              <button 
                onClick={() => {
                  addZona({
                    nama_zona: `Zona ${zonas.length + 1}`,
                    x1_pct: 0.2, y1_pct: 0.2, x2_pct: 0.5, y2_pct: 0.5,
                    warna: '#4CAF50'
                  });
                  setMode('edit');
                }}
                className="w-full py-4 border-2 border-dashed border-secondary-light text-secondary-dark font-bold text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-[#F1F5F9] hover:border-secondary transition-all"
              >
                <Plus size={18} /> Tambah Zona Baru
              </button>
            </div>

            <hr className="border-neutral-border/80" />

            {/* Panel: Detail Zona Terpilih */}
            <div>
               <h3 className="font-bold text-neutral-900 text-sm mb-6">Detail Zona Terpilih</h3>
               
               {selectedZonaData ? (
                 <>
                   <div className="mb-5">
                     <label className="text-[10px] font-extrabold text-secondary uppercase tracking-widest mb-2 block">Nama Zona</label>
                     <input 
                       className="w-full bg-[#E2E8F0]/60 border-none rounded-md px-3 py-2.5 text-sm font-bold text-neutral-900 focus:ring-1 focus:ring-primary outline-none transition-shadow"
                       value={selectedZonaData.nama_zona}
                       onChange={(e) => updateZona(selectedId!, { nama_zona: e.target.value })}
                     />
                   </div>

                   <div className="mb-6">
                     <label className="text-[10px] font-extrabold text-secondary uppercase tracking-widest mb-2 block">Koordinat (PX)</label>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#E2E8F0]/60 p-2.5 rounded-md">
                          <span className="text-[9px] font-bold text-secondary uppercase tracking-wider block">X1</span>
                          <div className="font-extrabold text-neutral-900 text-sm mt-0.5 leading-none">{Math.round(selectedZonaData.x1_pct * 1920)}</div>
                        </div>
                        <div className="bg-[#E2E8F0]/60 p-2.5 rounded-md">
                          <span className="text-[9px] font-bold text-secondary uppercase tracking-wider block">Y1</span>
                          <div className="font-extrabold text-neutral-900 text-sm mt-0.5 leading-none">{Math.round(selectedZonaData.y1_pct * 1080)}</div>
                        </div>
                        <div className="bg-[#E2E8F0]/60 p-2.5 rounded-md">
                          <span className="text-[9px] font-bold text-secondary uppercase tracking-wider block">X2</span>
                          <div className="font-extrabold text-neutral-900 text-sm mt-0.5 leading-none">{Math.round(selectedZonaData.x2_pct * 1920)}</div>
                        </div>
                        <div className="bg-[#E2E8F0]/60 p-2.5 rounded-md">
                          <span className="text-[9px] font-bold text-secondary uppercase tracking-wider block">Y2</span>
                          <div className="font-extrabold text-neutral-900 text-sm mt-0.5 leading-none">{Math.round(selectedZonaData.y2_pct * 1080)}</div>
                        </div>
                     </div>
                   </div>

                   <div className="mb-8">
                     <label className="text-[10px] font-extrabold text-secondary uppercase tracking-widest mb-3 block">Warna Deteksi</label>
                     <div className="flex gap-3">
                        {['#1B4D1E', '#3B82F6', '#F59E0B', '#A855F7'].map(color => (
                          <div 
                            key={color}
                            onClick={() => updateZona(selectedId!, { warna: color })}
                            className={`w-8 h-8 rounded-full cursor-pointer transition-transform ${selectedZonaData.warna === color ? 'ring-2 ring-offset-2 border border-white scale-110' : 'hover:scale-105'}`}
                            style={{ backgroundColor: color, borderColor: selectedZonaData.warna === color ? color : undefined }}
                          ></div>
                        ))}
                     </div>
                   </div>
                 </>
               ) : (
                 <div className="text-sm text-secondary text-center py-8">
                   Pilih zona dari daftar atau gambar di canvas untuk melihat detail.
                 </div>
               )}

               <Button 
                 onClick={saveAll}
                 disabled={isSaving}
                 className="w-full bg-[#0A3A17] hover:bg-[#1B4D1E] text-white flex items-center justify-center gap-2 py-3.5 rounded-lg shadow-[0_4px_14px_rgba(10,58,23,0.2)] transition-all font-bold text-sm disabled:opacity-70"
               >
                 <Database size={18} className="fill-white/10" /> {isSaving ? 'Menyimpan...' : 'Simpan ke Database'}
               </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
