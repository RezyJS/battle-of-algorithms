import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { FieldContextProvider } from '@/components/Field/FieldContext';
import { PlayerContextProvider } from '@/components/PlayerContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BOA',
  description: 'Platform for challenging your programming skills',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-dvw h-dvh m-0 p-0`}
      >
        <FieldContextProvider>
          <PlayerContextProvider>{children}</PlayerContextProvider>
        </FieldContextProvider>
      </body>
    </html>
  );
}
