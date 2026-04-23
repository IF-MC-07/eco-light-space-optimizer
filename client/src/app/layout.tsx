import './globals.css';
import Providers from './providers';

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
          {children}
        </Providers>
      </body>
    </html>
  );
}
