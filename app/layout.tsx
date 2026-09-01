import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import { BACKDROP } from '@/lib/theme';
import './globals.css';

const display = Archivo({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aperture Works — Series XI',
  description: 'A scroll-driven teardown of a camera built entirely in code.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable}`}
      style={{ '--backdrop': BACKDROP } as CSSProperties}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
