import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { Header } from '@/components/layout/Header'
import { InterestsModal } from '@/components/modals/InterestsModal'
import { getBaseUrl } from '@/lib/site'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Listur — Türkiye Teknoloji Etkinlikleri',
    template: '%s — Listur',
  },
  description:
    "Türkiye'deki hackathon, meetup, workshop ve konferansları tek platformda keşfet.",
  metadataBase: new URL(getBaseUrl()),
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Listur',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        <AuthProvider>
          {/* Header giriş/çıkış sayfalarında gizlenecek — o sayfalar kendi layout'unu yönetir */}
          <Header />
          <main className="flex-1">{children}</main>
          {/* İlgi alanı seçim modalı — ilk ziyarette açılır */}
          <InterestsModal />
        </AuthProvider>
      </body>
    </html>
  )
}
