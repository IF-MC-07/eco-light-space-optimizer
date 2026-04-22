import React from "react";
import { ArrowRight, Play, Eye, Cpu, Calendar, CheckCircle2, Mail } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";

export default function LandingPage() {
  return (
    <div className="w-full bg-neutral font-body text-secondary-dark">
      {/* Hero Section */}
      <section className="relative px-8 py-20 lg:py-32 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        <div className="lg:w-1/2 space-y-8">
          <div className="inline-flex items-center space-x-2 bg-primary-light/10 text-primary-dark px-3 py-1 rounded-full text-sm font-semibold border border-primary-light/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span>Sistem Otomatisasi Terbaru</span>
          </div>
          <h1 className="font-heading text-5xl lg:text-6xl font-bold leading-tight">
            Sistem Otomatis Pemantauan Ruang & <span className="text-primary">Efisiensi Energi</span> Kampus
          </h1>
          <p className="text-secondary-light text-lg max-w-lg leading-relaxed">
            Transformasikan operasional kampus Anda menjadi lebih cerdas. Solusi terintegrasi untuk pemantauan, hemat energi, dan kenyamanan secara real-time.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button className="w-full sm:w-auto text-lg px-8 py-6 flex items-center justify-center space-x-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors">
              <span>Mulai Sekarang</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-secondary-light text-secondary-dark hover:bg-white rounded-md flex items-center justify-center space-x-2 transition-colors">
              <Play className="w-5 h-5 text-secondary" />
              <span>Lihat Demo</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-neutral-border">
            <div>
              <p className="font-heading text-2xl font-bold text-primary-dark">20+</p>
              <p className="text-sm text-secondary-light">Ruang Terhubung</p>
            </div>
            <div>
              <p className="font-heading text-2xl font-bold text-primary-dark">Real-Time</p>
              <p className="text-sm text-secondary-light">Pemantauan</p>
            </div>
            <div>
              <p className="font-heading text-2xl font-bold text-primary-dark">40%</p>
              <p className="text-sm text-secondary-light">Hemat Energi</p>
            </div>
          </div>
        </div>

        <div className="lg:w-1/2 relative w-full aspect-square md:aspect-video lg:aspect-square bg-[#111827] rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
           {/* Mockup Dashboard Image Placeholder */}
           <div className="absolute inset-0 bg-gradient-to-tr from-primary-dark/20 to-transparent"></div>
           <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80" alt="Dashboard Mockup" className="w-[80%] rounded-xl shadow-xl opacity-90 border border-white/10" />
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Fitur Utama</h2>
          <p className="text-secondary-light max-w-2xl mx-auto mb-16">
            Teknologi inovatif yang dirancang untuk mengoptimalkan operasional dan menciptakan lingkungan kampus modern.
          </p>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-[#F8FAFC]">
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 bg-primary-light/20 rounded-xl flex items-center justify-center text-primary-dark">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg font-heading">Deteksi Kehadiran Presisi</h3>
                <p className="text-sm text-secondary-light leading-relaxed">
                  Sensor inframerah dan radar yang mendeteksi aktivitas, menyesuaikan pencahayaan & AC secara dinamis untuk kenyamanan pengguna.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-[#F8FAFC]">
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg font-heading">Automatisasi Pintar</h3>
                <p className="text-sm text-secondary-light leading-relaxed">
                  Sistem beroperasi tanpa intervensi manual, mengoptimalkan daya sesuai kondisi suhu luar & cahaya alami ruangan.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-[#F8FAFC]">
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 bg-tertiary/10 rounded-xl flex items-center justify-center text-tertiary">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg font-heading">Efisiensi Jadwal Cerdas</h3>
                <p className="text-sm text-secondary-light leading-relaxed">
                  Sinkronisasi langsung dengan jadwal kuliah sistem akademik, menghindari pemborosan listrik di ruang kosong.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="carakerja" className="py-24 bg-neutral">
        <div className="max-w-7xl mx-auto px-8 flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 rounded-3xl overflow-hidden shadow-lg bg-black aspect-square flex items-center justify-center relative">
            {/* IOT Graphic placeholder */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1B4D1E] via-black to-black opacity-60"></div>
            <div className="z-10 text-center">
              <h2 className="text-5xl font-bold font-heading text-cyan-400 tracking-widest drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">IOT</h2>
              <p className="text-cyan-200 text-xs mt-2 tracking-[0.2em]">INFRASTRUCTURE</p>
            </div>
            <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80" alt="IOT Graphic" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen" />
          </div>

          <div className="lg:w-1/2 space-y-10">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Cara Kerja Sistem</h2>
              <p className="text-secondary-light">
                Infrastruktur cerdas kami mengintegrasikan teknologi cloud dan sensor hardware untuk eksekusi tanpa jeda.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm">1</div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Data Collection</h4>
                  <p className="text-sm text-secondary-light">Sensor IoT di setiap ruangan mengumpulkan data okupansi dan kondisi lingkungan secara terus menerus.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm">2</div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Cloud Processing</h4>
                  <p className="text-sm text-secondary-light">Algoritma AI menganalisa pola dan membedakan profil energi setiap zona, mengkalkulasi output terbaik.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm">3</div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Automated Execution</h4>
                  <p className="text-sm text-secondary-light">Sistem mengirimkan perintah relay presisi untuk menyesuaikan perangkat keras AC dan lampu seketika itu juga.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto bg-primary-dark rounded-3xl overflow-hidden shadow-xl flex flex-col md:flex-row items-center p-12 gap-12">
          <div className="md:w-1/2 space-y-6 text-white">
            <h2 className="font-heading text-3xl font-bold">Teknologi Terdepan</h2>
            <p className="text-primary-light text-sm leading-relaxed max-w-md">
              Menggunakan arsitektur terkini untuk memastikan skalabilitas, keamanan tingkat tinggi, dan reliabilitas jangka panjang.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-primary-light" />
                <span>MQTT WebSockets protokol pengiriman</span>
              </li>
              <li className="flex items-center space-x-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-primary-light" />
                <span>PostgreSQL database terenkripsi</span>
              </li>
              <li className="flex items-center space-x-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-primary-light" />
                <span>React.js dengan UI/UX Modern (SPA)</span>
              </li>
            </ul>
          </div>

          <div className="md:w-1/2 grid grid-cols-2 gap-4 w-full">
            <div className="bg-white/10 rounded-xl p-6 text-center border border-white/5 backdrop-blur-sm">
              <h4 className="text-3xl font-bold font-heading text-white">99.9%</h4>
              <p className="text-primary-light text-xs mt-1">Uptime</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6 text-center border border-white/5 backdrop-blur-sm">
              <h4 className="text-3xl font-bold font-heading text-white">&lt;50ms</h4>
              <p className="text-primary-light text-xs mt-1">Latency</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6 text-center border border-white/5 backdrop-blur-sm">
              <h4 className="text-3xl font-bold font-heading text-white">TLS 1.3</h4>
              <p className="text-primary-light text-xs mt-1">Security</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6 text-center border border-white/5 backdrop-blur-sm">
              <h4 className="text-3xl font-bold font-heading text-white">IPv6</h4>
              <p className="text-primary-light text-xs mt-1">Ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="tim" className="py-24 bg-neutral">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="font-heading text-3xl font-bold mb-4">Tim Pengembang</h2>
          <p className="text-secondary-light max-w-2xl mx-auto mb-16">
            Pakar di balik inovasi kami, menggabungkan keahlian teknik elektro dan rekayasa perangkat lunak.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "Aria Setiawan", role: "Software Architect", img: "https://i.pravatar.cc/150?u=a042581f4e29026024d" },
              { name: "Siti Rahma", role: "Hardware Engineer", img: "https://i.pravatar.cc/150?u=a042581f4e29026704d" },
              { name: "Budi Santoso", role: "UI/UX Specialist", img: "https://i.pravatar.cc/150?u=a04258a2462d826712d" },
              { name: "Maya Putri", role: "Project Manager", img: "https://i.pravatar.cc/150?u=a042581f4e29026704f" }
            ].map((member, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-2xl overflow-hidden mb-4 shadow-lg border-4 border-white bg-white">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="font-bold text-lg text-secondary-dark">{member.name}</h4>
                <p className="text-xs font-medium text-secondary-light">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <h2 className="font-heading text-3xl font-bold mb-4">Siap Memulai Efisiensi?</h2>
          <p className="text-secondary-light mb-8">
            Hubungi tim kami untuk konsultasi gratis mengenai implementasi sistem Eco-Light di kampus Anda.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <div className="relative w-full">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-light w-5 h-5" />
              <Input type="email" placeholder="Email institusi Anda" className="pl-10 h-12 w-full bg-[#F1F5F9] border-none shadow-sm" />
            </div>
            <Button className="w-full sm:w-auto h-12 px-8 bg-primary hover:bg-primary-dark text-white rounded-md whitespace-nowrap">
              Jadwalkan Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-border bg-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <LeafIcon className="w-8 h-8 text-primary" />
              <span className="font-heading font-bold text-xl text-primary">Eco-Light</span>
            </div>
            <p className="text-sm text-secondary-light max-w-sm">
              Mewujudkan kampus hijau dan efisien energi melalui teknologi pintar dan manajemen otomatisasi terpadu.
            </p>
          </div>
          <div>
            <h5 className="font-bold mb-4 text-secondary-dark">Tautan Cepat</h5>
            <ul className="space-y-2 text-sm text-secondary-light">
              <li><a href="#" className="hover:text-primary transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Studi Kasus</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Dokumentasi API</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Kontak</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4 text-secondary-dark">Hubungi Kami</h5>
            <ul className="space-y-2 text-sm text-secondary-light">
              <li>hello@eco-light.id</li>
              <li>Kampus Digital, Jalan Sudirman Jakarta</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 pt-8 border-t border-neutral-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-secondary-light">
          <p>&copy; 2026 Eco-Light & Space Optimizer. Hak Cipta Dilindungi.</p>
          <div className="flex items-center space-x-4">
            <a href="#" className="hover:text-primary">Kebijakan Privasi</a>
            <a href="#" className="hover:text-primary">Syarat & Ketentuan</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LeafIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11 20A7 7 0 0 1 14 6c.5 3 2.5 5 5 6a10 10 0 0 1-8 8Z" />
      <path d="M2 12a10 10 0 0 1 10-10c.5 3 2.5 5 5 6" />
      <path d="M14 6c-.5 3-2.5 5-5 6a10 10 0 0 1-7-7" />
    </svg>
  );
}
