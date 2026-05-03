import './globals.css';
import Providers from './providers';
import { Layout } from '@/components/layout/Layout';

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
      <body>
        <Providers>
          <Layout>
            {children}
          </Layout>
        </Providers>
      </body>
    </html>
  );
}
