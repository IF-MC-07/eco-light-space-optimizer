import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-layout flex min-h-screen bg-neutral">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Navbar variant="admin" />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
