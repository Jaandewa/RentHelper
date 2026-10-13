import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import CursorBackground from '@/components/ui/CursorBackground'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RentHelper | Rental Management Platform',
  description: 'Manage your rental business with confidence. Cameras, vehicles, party items, tools, and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Interactive cursor-reactive background — sits behind everything */}
        <CursorBackground />
        <Providers>
          <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}

