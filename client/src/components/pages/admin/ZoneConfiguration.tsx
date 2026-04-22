import React from 'react';
import { Layout } from '../../layout/Layout';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { 
  ChevronDown, Move, Eye, Trash2, 
  MousePointer2, Info, History, Plus, Database 
} from 'lucide-react';

export default function ZoneConfiguration() {
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
               <span className="text-sm font-bold text-secondary-dark leading-none">CCTV North-Entrance-01</span>
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
                <button className="flex items-center gap-2.5 bg-white text-primary px-4 py-2 rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-sm font-bold border-transparent transition-all">
                  <div className="flex items-center justify-center">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  Gambar Zona
                </button>
                <button className="flex items-center gap-2.5 text-secondary px-5 py-2 text-sm font-bold hover:text-secondary-dark transition-colors">
                  <Move size={16} /> Pindah / Ubah
                </button>
                <button className="flex items-center gap-2.5 text-secondary px-5 py-2 text-sm font-bold hover:text-secondary-dark transition-colors">
                  <Eye size={16} /> Preview Inferensi
                </button>
              </div>

              <button className="flex items-center gap-2 text-tertiary px-4 py-2 text-sm font-bold hover:bg-red-50 rounded-md transition-colors">
                <Trash2 size={16} /> Hapus Semua
              </button>
            </div>

            {/* Canvas / Image Area */}
            <div className="relative w-full aspect-[16/9] bg-[#0F172A] rounded-2xl overflow-hidden shadow-elevated border border-neutral-border border-opacity-50">
               
               {/* Decorative background overlay simulating a dim dark room */}
               <div className="absolute inset-0 opacity-40 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-0"></div>
               {/* Minimal abstract shapes to look slightly like an office background silhouette */}
               <div className="absolute bottom-0 right-10 w-32 h-40 bg-[#1E293B] rounded-t-lg blur opacity-30"></div>
               <div className="absolute bottom-0 left-20 w-48 h-20 bg-[#1E293B] rounded-t-lg blur opacity-30"></div>
               
               {/* Drawn Zones Overlay */}
               {/* Zone 1 */}
               <div className="absolute top-[18%] left-[10%] w-[18%] h-[40%] border-2 border-[#4CAF50] border-dashed bg-[#4CAF50]/10 z-10 group cursor-pointer hover:bg-[#4CAF50]/20 transition-colors">
                 <div className="absolute -top-7 left-0 bg-[#4CAF50] text-[#0A2612] text-[10px] font-bold px-2 py-1 whitespace-nowrap shadow-sm">
                    Zone 1 | x:192, y:162
                 </div>
               </div>

               {/* Zone 2 */}
               <div className="absolute top-[30%] left-[40%] w-[15%] h-[35%] border-2 border-[#4CAF50] border-dashed bg-[#4CAF50]/10 z-10 group cursor-pointer hover:bg-[#4CAF50]/20 transition-colors opacity-60 hover:opacity-100">
                 <div className="absolute -top-7 left-0 bg-[#4CAF50] text-[#0A2612] text-[10px] font-bold px-2 py-1 whitespace-nowrap shadow-sm">
                    Zone 2 | x:768, y:270
                 </div>
               </div>

               {/* Zone 3 */}
               <div className="absolute top-[12%] right-[12%] w-[16%] h-[28%] border-2 border-[#4CAF50] border-dashed bg-[#4CAF50]/10 z-10 group cursor-pointer hover:bg-[#4CAF50]/20 transition-colors opacity-60 hover:opacity-100">
                 <div className="absolute -top-7 left-0 bg-[#4CAF50] text-[#0A2612] text-[10px] font-bold px-2 py-1 whitespace-nowrap shadow-sm">
                    Zone 3 | x:1248, y:100
                 </div>
               </div>

               {/* Floating instructional popup overlay */}
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-5 py-3 rounded-lg flex items-center gap-3 text-sm font-semibold border border-white/10 shadow-2xl z-20 pointer-events-none">
                 <MousePointer2 size={18} className="text-white/80" /> 
                 <span>Klik dan seret untuk menggambar zona baru</span>
               </div>
            </div>

            {/* Canvas Footer */}
            <div className="flex items-center gap-6 mt-3 px-2 text-[11px] font-bold text-secondary-light">
              <div className="flex items-center gap-1.5 hover:text-secondary cursor-default transition-colors">
                 <Info size={14} /> Koordinat berdasarkan resolusi 1920x1080
              </div>
              <div className="flex items-center gap-1.5 hover:text-secondary cursor-default transition-colors">
                 <History size={14} /> Terakhir diubah: 2 menit yang lalu
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar Configuration Panels) - 1 Column */}
          <div className="lg:col-span-1 flex flex-col gap-8 bg-[#F8FAFC] p-6 rounded-2xl border border-neutral-border/50">
            
            {/* Panel: Daftar Zona */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-neutral-900 text-sm">Daftar Zona</h3>
                <span className="px-2 py-1 bg-[#E2E8F0] text-secondary-dark font-extrabold text-[9px] rounded uppercase tracking-widest">3 Total</span>
              </div>

              <div className="space-y-2 mb-4">
                {/* Active Zone Item */}
                <div className="flex items-center justify-between p-3.5 bg-white border-2 border-[#2E7D32] rounded-lg shadow-[0_2px_8px_rgba(46,125,50,0.1)] cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1B4D1E]"></div>
                    <span className="text-sm font-bold text-[#1B4D1E]">Zone 1</span>
                  </div>
                  <button className="text-secondary-light hover:text-tertiary transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Inactive Zone Item 2 */}
                <div className="flex items-center p-3.5 bg-white border border-transparent hover:border-neutral-border rounded-lg cursor-pointer transition-colors shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]"></div>
                    <span className="text-sm font-semibold text-secondary-dark">Zone 2</span>
                  </div>
                </div>

                {/* Inactive Zone Item 3 */}
                <div className="flex items-center p-3.5 bg-white border border-transparent hover:border-neutral-border rounded-lg cursor-pointer transition-colors shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]"></div>
                    <span className="text-sm font-semibold text-secondary-dark">Zone 3</span>
                  </div>
                </div>
              </div>

              {/* Add Zone Button */}
              <button className="w-full py-4 border-2 border-dashed border-secondary-light text-secondary-dark font-bold text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-[#F1F5F9] hover:border-secondary transition-all">
                <Plus size={18} /> Tambah Zona Baru
              </button>
            </div>

            <hr className="border-neutral-border/80" />

            {/* Panel: Detail Zona Terpilih */}
            <div>
               <h3 className="font-bold text-neutral-900 text-sm mb-6">Detail Zona Terpilih</h3>
               
               <div className="mb-5">
                 <label className="text-[10px] font-extrabold text-secondary uppercase tracking-widest mb-2 block">Nama Zona</label>
                 <div className="w-full bg-[#E2E8F0]/60 border-none rounded-md px-3 py-2.5 text-sm font-bold text-neutral-900 focus-within:ring-1 focus-within:ring-primary transition-shadow">
                    Zone 1
                 </div>
               </div>

               <div className="mb-6">
                 <label className="text-[10px] font-extrabold text-secondary uppercase tracking-widest mb-2 block">Koordinat (PX)</label>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#E2E8F0]/60 p-2.5 rounded-md cursor-text hover:bg-[#E2E8F0] transition-colors">
                      <span className="text-[9px] font-bold text-secondary uppercase tracking-wider block">X1</span>
                      <div className="font-extrabold text-neutral-900 text-sm mt-0.5 leading-none">192</div>
                    </div>
                    <div className="bg-[#E2E8F0]/60 p-2.5 rounded-md cursor-text hover:bg-[#E2E8F0] transition-colors">
                      <span className="text-[9px] font-bold text-secondary uppercase tracking-wider block">Y1</span>
                      <div className="font-extrabold text-neutral-900 text-sm mt-0.5 leading-none">162</div>
                    </div>
                    <div className="bg-[#E2E8F0]/60 p-2.5 rounded-md cursor-text hover:bg-[#E2E8F0] transition-colors">
                      <span className="text-[9px] font-bold text-secondary uppercase tracking-wider block">X2</span>
                      <div className="font-extrabold text-neutral-900 text-sm mt-0.5 leading-none">672</div>
                    </div>
                    <div className="bg-[#E2E8F0]/60 p-2.5 rounded-md cursor-text hover:bg-[#E2E8F0] transition-colors">
                      <span className="text-[9px] font-bold text-secondary uppercase tracking-wider block">Y2</span>
                      <div className="font-extrabold text-neutral-900 text-sm mt-0.5 leading-none">594</div>
                    </div>
                 </div>
               </div>

               <div className="mb-8">
                 <label className="text-[10px] font-extrabold text-secondary uppercase tracking-widest mb-3 block">Warna Deteksi</label>
                 <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1B4D1E] cursor-pointer ring-2 ring-offset-2 ring-[#1B4D1E] border border-white"></div>
                    <div className="w-8 h-8 rounded-full bg-[#3B82F6] cursor-pointer hover:scale-105 transition-transform"></div>
                    <div className="w-8 h-8 rounded-full bg-[#F59E0B] cursor-pointer hover:scale-105 transition-transform"></div>
                    <div className="w-8 h-8 rounded-full bg-[#A855F7] cursor-pointer hover:scale-105 transition-transform"></div>
                 </div>
               </div>

               <Button className="w-full bg-[#0A3A17] hover:bg-[#1B4D1E] text-white flex items-center justify-center gap-2 py-3.5 rounded-lg shadow-[0_4px_14px_rgba(10,58,23,0.2)] transition-all font-bold text-sm">
                 <Database size={18} className="fill-white/10" /> Simpan ke Database
               </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
