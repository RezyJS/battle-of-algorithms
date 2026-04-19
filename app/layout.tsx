import type { Metadata } from 'next';
import { Navbar } from '@/src/shared/ui/Navbar';
import { getCurrentUser } from '@/src/shared/lib/auth/session';
import './globals.css';

export const metadata: Metadata = {
  title: 'Битва алгоритмов',
  description: 'Платформа для соревнования алгоритмов',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="ru">
      <body className="min-h-screen flex flex-col text-slate-950 antialiased">
        <Navbar currentUser={currentUser} />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
