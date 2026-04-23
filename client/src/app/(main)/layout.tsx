import { Navbar } from '@/components/layout/Navbar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="main-layout min-h-screen flex flex-col">
      <Navbar variant="public" />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
