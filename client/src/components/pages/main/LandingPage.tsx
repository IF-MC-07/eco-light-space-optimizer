"use client";

import React from 'react';
import {
  ChevronRight, Play, Activity, Settings2, ShieldAlert,
  CheckCircle2, Bell, Settings, User
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../ui/Card';
import { Input } from '../../ui/Input';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral flex flex-col font-body text-secondary-dark">
      {/* Landing Navbar */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-neutral-border flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.06 19.43 4 16.05 4 12C4 7.95 7.06 4.57 11 4.07V19.93ZM13 4.07C16.94 4.57 20 7.95 20 12C20 16.05 16.94 19.43 13 19.93V4.07Z" fill="currentColor" />
          </svg>
          <div className="flex flex-col">
            <span className="text-neutral-900 font-extrabold tracking-tight text-lg leading-none">Eco-Light</span>
            <span className="text-[10px] text-primary-light font-medium tracking-wide uppercase leading-tight mt-0.5">Space Optimizer</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-bold text-primary border-b-2 border-primary pb-1">Home</a>
          <a href="#" className="text-sm font-semibold text-secondary hover:text-primary transition-colors pb-1">Fitur Utama</a>
          <a href="#" className="text-sm font-semibold text-secondary hover:text-primary transition-colors pb-1">Cara Kerja</a>
          <a href="#" className="text-sm font-semibold text-secondary hover:text-primary transition-colors pb-1">Tim</a>
        </nav>

        <div className="flex items-center gap-5 text-secondary-light">
          <button className="hover:text-secondary-dark transition-colors relative">
            <Bell size={20} />
            <span className="absolute 0 right-0 w-2 h-2 bg-tertiary rounded-full border border-white"></span>
          </button>
          <button className="hover:text-secondary-dark transition-colors">
            <Settings size={20} />
          </button>
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <User size={16} />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-8 pt-20 pb-24 max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col items-start z-10">
          <Badge variant="primary" className="mb-6 px-3 py-1 font-bold tracking-widest text-[10px]">
            DIGITAL CAMPUS INITIATIVE
          </Badge>
          <h1 className="text-5xl md:text-[56px] font-heading leading-[1.1] tracking-tight text-neutral-900 mb-6">
            Sistem Otomatis Pemantauan Ruang <br />
            <span className="text-primary">& Efisiensi Energi</span> <br />
            Kampus
          </h1>
          <p className="text-secondary text-lg leading-relaxed max-w-lg mb-10">
            Transformasikan ekosistem kampus Anda menjadi Digital Arboretum yang cerdas, hemat energi, dan terpantau secara real-time.
          </p>
          <div className="flex flex-wrap items-center gap-4 mb-14">
            <Button variant="primary" className="py-3 px-6 text-base shadow-elevated group">
              Mulai Sekarang
              <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outlined" className="py-3 px-6 text-base bg-white border-neutral-border hover:bg-neutral">
              Lihat Demo
            </Button>
          </div>
          <div className="flex items-center gap-12">
            <div>
              <div className="text-3xl font-heading font-extrabold text-neutral-900">20+</div>
              <div className="text-xs font-semibold text-secondary uppercase tracking-wider mt-1">Ruang Terhubung</div>
            </div>
            <div>
              <div className="text-3xl font-heading font-extrabold text-neutral-900">Real-Time</div>
              <div className="text-xs font-semibold text-secondary uppercase tracking-wider mt-1">Pemantauan</div>
            </div>
            <div>
              <div className="text-3xl font-heading font-extrabold text-neutral-900">40%</div>
              <div className="text-xs font-semibold text-secondary uppercase tracking-wider mt-1">Hemat Energi</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex justify-end">
          <div className="w-[540px] h-[480px] bg-[#111827] rounded-3xl shadow-2xl relative overflow-hidden border border-neutral-border/10 flex items-center justify-center">
            {/* Dashboard Mockup Placeholder */}
            <div className="w-[85%] h-[75%] bg-[#1F2937] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
              <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
                </div>
                <Badge variant="primary" className="ml-2 bg-[#2E7D32]/20 text-[#4CAF50] border-none text-[8px] py-0">System Active</Badge>
              </div>
              <div className="flex-1 p-5 grid gap-4 grid-cols-2">
                <div className="col-span-2 h-24 bg-white/5 rounded-lg border border-white/5 flex items-end p-3 gap-2">
                  <div className="w-1/6 h-[30%] bg-primary/40 rounded-sm"></div>
                  <div className="w-1/6 h-[50%] bg-primary/60 rounded-sm"></div>
                  <div className="w-1/6 h-[40%] bg-primary/40 rounded-sm"></div>
                  <div className="w-1/6 h-[80%] bg-primary rounded-sm"></div>
                  <div className="w-1/6 h-[60%] bg-primary/80 rounded-sm"></div>
                  <div className="w-1/6 h-[90%] bg-primary rounded-sm"></div>
                </div>
                <div className="h-16 bg-white/5 rounded-lg border border-white/5 p-3 flex flex-col justify-center">
                  <div className="w-1/2 h-2 bg-white/20 rounded mb-2"></div>
                  <div className="w-3/4 h-3 bg-white/40 rounded"></div>
                </div>
                <div className="h-16 bg-white/5 rounded-lg border border-white/5 p-3 flex flex-col justify-center">
                  <div className="w-1/2 h-2 bg-white/20 rounded mb-2"></div>
                  <div className="w-3/4 h-3 bg-white/40 rounded"></div>
                </div>
                <div className="col-span-2 h-10 bg-white/5 rounded-lg border border-white/5 flex items-center px-4 justify-between">
                  <div className="w-1/3 h-2 bg-white/20 rounded"></div>
                  <div className="w-5 h-5 rounded-full bg-primary/40"></div>
                </div>
              </div>
            </div>

            {/* Background glowing effects */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24 border-y border-neutral-border">
        <div className="max-w-[1200px] mx-auto px-8 w-full text-center">
          <h2 className="text-4xl font-heading text-neutral-900 mb-4 font-extrabold">Fitur Utama</h2>
          <p className="text-secondary max-w-2xl mx-auto mb-16">
            Teknologi mutakhir yang dirancang untuk mengoptimalkan sistem kampus agar bernilai tambah optimal.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <Card className="p-8 shadow-sm hover:shadow-elevated transition-shadow">
              <div className="w-12 h-12 bg-green-50 text-primary rounded-xl flex items-center justify-center mb-6">
                <Activity size={24} />
              </div>
              <h3 className="text-xl font-bold font-heading mb-3 text-neutral-900">Deteksi Okupansi Presisi</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Sensor Pintar AI kami memantau pergerakan & suhu ruangan mengintegrasi AC dan lampu bila terdeteksi tidak ada aktivitas.
              </p>
            </Card>

            <Card className="p-8 shadow-sm hover:shadow-elevated transition-shadow">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Settings2 size={24} />
              </div>
              <h3 className="text-xl font-bold font-heading mb-3 text-neutral-900">Smart Scene Mode</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Kehadiran fitur jadwal otomatis yang disesuaikan dengan variasi perkuliahan di kelas demi meminimalkan emisi CO2.
              </p>
            </Card>

            <Card className="p-8 shadow-sm hover:shadow-elevated transition-shadow">
              <div className="w-12 h-12 bg-red-50 text-tertiary rounded-xl flex items-center justify-center mb-6">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-xl font-bold font-heading mb-3 text-neutral-900">Notifikasi Anomali</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Sistem memberikan pemberitahuan secara real-time apabila mendeteksi penggunaan daya/perangkat abnormal guna memitigasi risiko keamanan.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 max-w-[1200px] mx-auto px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="relative flex justify-center">
          <div className="w-[500px] h-[500px] bg-[#0A192F] rounded-[40px] shadow-2xl relative flex items-center justify-center overflow-hidden border border-neutral-border/20">
            <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle, transparent 20%, #0A192F 120%), repeating-radial-gradient(circle, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 40px)' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[300px] h-[300px] border border-cyan-500/30 rounded-full animate-[spin_20s_linear_infinite]"></div>
              <div className="absolute w-[200px] h-[200px] border border-blue-500/40 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
              <div className="absolute w-[100px] h-[100px] border border-primary/50 rounded-full flex items-center justify-center bg-primary/10 shadow-[0_0_30px_rgba(46,125,50,0.5)]">
                <span className="text-4xl font-heading font-black text-white tracking-widest">IOT</span>
              </div>
            </div>
            <div className="absolute bottom-10 text-center">
              <div className="text-cyan-400 font-bold tracking-[0.2em] text-xs">IOT INFRASTRUCTURE</div>
              <div className="text-white/40 text-[10px] tracking-widest mt-1">TRANSMITTING SECURE DATA NODE</div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-4xl font-heading text-neutral-900 mb-4 font-extrabold">Cara Kerja Sistem</h2>
          <p className="text-secondary mb-12">
            Sistem kami dirancang memadukan IoT infrastruktur dan simulasi komputasi awan.
          </p>

          <div className="space-y-8">
            <div className="flex gap-5">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm mt-1">1</div>
              <div>
                <h4 className="text-lg font-bold text-neutral-900 mb-1">Data Collection</h4>
                <p className="text-secondary text-sm leading-relaxed">
                  Sensor IoT di setiap ruangan mengumpulkan data okupansi dan kondisi lingkungan secara terus-menerus.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm mt-1">2</div>
              <div>
                <h4 className="text-lg font-bold text-neutral-900 mb-1">Cloud Processing</h4>
                <p className="text-secondary text-sm leading-relaxed">
                  Algoritma AI menganalisa pola dan tren efisiensi serta memberikan rekomendasi penghematan energi.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm mt-1">3</div>
              <div>
                <h4 className="text-lg font-bold text-neutral-900 mb-1">Automated Execution</h4>
                <p className="text-secondary text-sm leading-relaxed">
                  Sistem mengirim perintah otomatis untuk mematikan perangkat bila mendeteksi ruangan kosong.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Specs Section */}
      <section className="px-8 py-10 w-full flex justify-center">
        <div className="max-w-[1200px] w-full bg-primary-dark rounded-[32px] p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-2 gap-12 shadow-2xl text-white relative overflow-hidden">
          {/* Abstract background for green card */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>

          <div className="relative z-10 flex flex-col justify-center">
            <h2 className="text-4xl font-heading font-extrabold mb-4">Teknologi Terdepan</h2>
            <p className="text-[#86B690] mb-8 max-w-md text-sm leading-relaxed">
              Menggunakan arsitektur komputasi mutakhir dan Machine Learning terkini untuk optimasi sistem di seluruh kampus.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary-light" size={20} />
                <span className="font-medium text-sm">Infrastruktur end-to-end terjamin aman</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary-light" size={20} />
                <span className="font-medium text-sm">Terintegrasi dengan protokol universitas</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary-light" size={20} />
                <span className="font-medium text-sm">Skalabilitas tanpa batas (AWS Cloud)</span>
              </li>
            </ul>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col justify-center items-center text-center">
              <div className="text-3xl font-heading font-extrabold mb-1">99.9%</div>
              <div className="text-xs text-[#86B690] uppercase tracking-wider font-bold">Uptime</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col justify-center items-center text-center">
              <div className="text-3xl font-heading font-extrabold mb-1">&lt;50ms</div>
              <div className="text-xs text-[#86B690] uppercase tracking-wider font-bold">Latency</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col justify-center items-center text-center">
              <div className="text-3xl font-heading font-extrabold mb-1">TLS 1.3</div>
              <div className="text-xs text-[#86B690] uppercase tracking-wider font-bold">Security</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col justify-center items-center text-center">
              <div className="text-3xl font-heading font-extrabold mb-1">IPv6</div>
              <div className="text-xs text-[#86B690] uppercase tracking-wider font-bold">Ready</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 max-w-[1200px] mx-auto px-8 w-full text-center">
        <h2 className="text-4xl font-heading text-neutral-900 mb-4 font-extrabold">Tim Pengembang</h2>
        <p className="text-secondary max-w-2xl mx-auto mb-16">
          Para ahli yang berikrar menuju ekosistem kampus berkelanjutan masa kini dan masa depan.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 rounded-2xl bg-neutral-surface shadow-md overflow-hidden mb-4 border border-neutral-border">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aris&backgroundColor=b6e3f4" alt="Aris Setiawan" className="w-full h-full object-cover" />
            </div>
            <h4 className="font-bold text-neutral-900">Aris Setiawan</h4>
            <p className="text-xs text-secondary font-medium">IoT System Architect</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-40 h-40 rounded-2xl bg-neutral-surface shadow-md overflow-hidden mb-4 border border-neutral-border">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Siti&backgroundColor=c0aede" alt="Siti Rahma" className="w-full h-full object-cover" />
            </div>
            <h4 className="font-bold text-neutral-900">Siti Rahma</h4>
            <p className="text-xs text-secondary font-medium">AI/ML Developer</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-40 h-40 rounded-2xl bg-neutral-surface shadow-md overflow-hidden mb-4 border border-neutral-border">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Budi&backgroundColor=ffdfbf" alt="Budi Santoso" className="w-full h-full object-cover" />
            </div>
            <h4 className="font-bold text-neutral-900">Budi Santoso</h4>
            <p className="text-xs text-secondary font-medium">Backend Specialist</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-40 h-40 rounded-2xl bg-neutral-surface shadow-md overflow-hidden mb-4 border border-neutral-border">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Maya&backgroundColor=d1d4f9" alt="Maya Putri" className="w-full h-full object-cover" />
            </div>
            <h4 className="font-bold text-neutral-900">Maya Putri</h4>
            <p className="text-xs text-secondary font-medium">Project Manager</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-neutral-border bg-white text-center">
        <div className="max-w-2xl mx-auto px-8">
          <h2 className="text-4xl font-heading text-neutral-900 mb-4 font-extrabold">Siap Memulai Efisiensi?</h2>
          <p className="text-secondary mb-10">
            Hubungi tim kami untuk konsultasi gratis integrasi Eco-Optimizer dalam ekosistem ruang kelas kampus Anda.
          </p>
          <div className="flex w-full items-center justify-center mb-4 max-w-lg mx-auto">
            <div className="relative flex w-full">
              <input
                type="email"
                placeholder="Email perusahaan..."
                className="w-full h-12 bg-neutral border border-neutral-border rounded-l-md px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm"
              />
              <Button variant="primary" className="h-12 rounded-l-none rounded-r-md px-8 font-bold flex-shrink-0 shadow-sm shadow-primary/20">
                Minta Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-border py-12 px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.06 19.43 4 16.05 4 12C4 7.95 7.06 4.57 11 4.07V19.93ZM13 4.07C16.94 4.57 20 7.95 20 12C20 16.05 16.94 19.43 13 19.93V4.07Z" fill="currentColor" />
              </svg>
              <div className="flex flex-col">
                <span className="text-neutral-900 font-extrabold tracking-tight text-lg leading-none">Eco-Light</span>
              </div>
            </div>
            <p className="text-xs text-secondary max-w-[280px] leading-relaxed">
              Mewujudkan kampus yang lebih cerdas dan ramah lingkungan melalui teknologi pemantauan ekosistem ruang berbasis AI & IoT.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm text-neutral-900 mb-5">Tautan Cepat</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-xs font-semibold text-secondary hover:text-primary transition-colors">Beranda</a></li>
              <li><a href="#" className="text-xs font-semibold text-secondary hover:text-primary transition-colors">Fitur Utama</a></li>
              <li><a href="#" className="text-xs font-semibold text-secondary hover:text-primary transition-colors">Cara Kerja</a></li>
              <li><a href="#" className="text-xs font-semibold text-secondary hover:text-primary transition-colors">Dokumentasi API</a></li>
              <li><a href="#" className="text-xs font-semibold text-secondary hover:text-primary transition-colors">Kontak</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-neutral-900 mb-5">Hubungi Kami</h4>
            <ul className="space-y-3">
              <li className="text-xs font-semibold text-secondary flex items-start gap-2">
                <span className="mt-0.5">✉️</span> info@eco-light.id
              </li>
              <li className="text-xs font-semibold text-secondary leading-relaxed flex items-start gap-2">
                <span className="mt-0.5">🏢</span> Kampus Digital Arboretum <br /> Jakarta, Indonesia 12345
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto mt-12 pt-8 border-t border-neutral-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-bold text-secondary-light tracking-widest uppercase">
            © 2024 Eco-Light Space Optimizer. Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-4 text-[10px] font-bold text-secondary uppercase tracking-widest">
            <a href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-primary transition-colors">Syarat & Ketentuan</a>
          </div>
        </div>
      </footer>

      {/* Floating Chat Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-elevated flex items-center justify-center hover:bg-primary-dark transition-colors z-50">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
      </button>
    </div>
  );
}
