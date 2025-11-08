/**
 * Root Layout
 *
 * Next.js 15 App Router root layout.
 * Uses modular branding for metadata.
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header, Footer } from '@/components';
import { branding } from '@/config';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: branding.name,
    template: `%s | ${branding.name}`,
  },
  description: branding.description,
  keywords: branding.keywords,
  openGraph: {
    type: branding.og.type,
    locale: branding.og.locale,
    siteName: branding.og.siteName,
  },
  twitter: {
    card: branding.twitter.card,
    site: branding.twitter.site,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
