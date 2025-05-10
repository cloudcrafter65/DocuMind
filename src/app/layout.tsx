import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'DocuMind - Intelligent Document Scanner',
  description: 'Scan, extract text, and process documents intelligently with AI.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    shortcut: '/icons/favicon.ico',
    apple: '/icons/apple-touch-icon.png'
  },
  openGraph: {
    type: 'website',
    url: 'https://documind.maya.im',
    title: 'DocuMind - Intelligent Document Scanner',
    description: 'Scan, extract text, and process documents intelligently with AI.',
    siteName: 'DocuMind',
    images: [
      {
        url: '/icons/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'DocuMind Logo'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DocuMind - Intelligent Document Scanner',
    description: 'Scan, extract text, and process documents intelligently with AI.',
    images: ['/icons/android-chrome-512x512.png']
  },
  keywords: ['document scanner', 'AI', 'text extraction', 'OCR', 'document processing']
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F5F5" },
    { media: "(prefers-color-scheme: dark)", color: "#1E213A" },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head />
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
