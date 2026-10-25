import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { OrderDetailsProvider } from '@/components/order-details/order-details-provider'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Import Savdo — mahsulot va buyurtmalar',
  description: 'Kichik import biznesi uchun mahsulot, buyurtma, mijoz va to‘lovlarni boshqarish tizimi.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uz" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <OrderDetailsProvider>
          <AppShell>{children}</AppShell>
        </OrderDetailsProvider>
        <Toaster position="top-right" richColors closeButton theme="light" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
