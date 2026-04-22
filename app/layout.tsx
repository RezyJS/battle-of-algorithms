import type { Metadata } from 'next';
import { Navbar } from '@/src/shared/ui/Navbar';
import { getCurrentUser } from '@/src/shared/lib/auth/session';
import './globals.css';

export const metadata: Metadata = {
  title: 'Битва алгоритмов',
  description: 'Платформа для соревнования алгоритмов',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [
      {
        rel: 'android-chrome',
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'android-chrome',
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
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
