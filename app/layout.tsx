import type { Metadata } from 'next';
import { Navbar } from '@/src/shared/ui/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Битва алгоритмов',
  description: 'Платформа для соревнования алгоритмов',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-gray-950 text-white min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
