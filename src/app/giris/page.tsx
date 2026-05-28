import { Suspense } from 'react'
import Link from 'next/link'
import { AuthForm } from '@/components/forms/AuthForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Giriş Yap — Listur',
  description: 'Listur hesabınıza giriş yapın veya yeni hesap oluşturun.',
}

export default function GirisPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-indigo-600">Listur</Link>
          <p className="text-gray-500 mt-2 text-sm">Türkiye&apos;nin teknoloji etkinlik platformu</p>
        </div>

        {/* Kart */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-xl" />}>
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
