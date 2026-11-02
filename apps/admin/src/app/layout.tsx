import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import { AuthProvider } from '@/lib/auth-context';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Jhatpat Admin',
    template: '%s | Jhatpat Admin',
  },
  description: 'Operations and store management portal for Jhatpat.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${inter.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-canvas font-sans text-ink antialiased" suppressHydrationWarning>
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}

