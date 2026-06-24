import './globals.css';
import Providers from './providers';
import { Layout } from '@/components/layout/Layout';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Eco-light Space Optimizer',
  description: 'Mewujudkan kampus hijau dan efisien energi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <Layout>
            {children}
          </Layout>
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
