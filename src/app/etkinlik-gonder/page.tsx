import { Suspense } from 'react'
import type { Metadata } from 'next'
import { EventSubmitForm } from '@/components/forms/EventSubmitForm'

export const metadata: Metadata = {
  title: 'Etkinlik Gönder — Listur',
  description: "Türkiye'deki teknoloji etkinliğini Listur'a ekleyin.",
}

export default function EtkinlikGonderPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Etkinlik Gönder</h1>
        <p className="text-gray-500">
          Etkinlik linkini yapıştırın, bilgileri otomatik dolduralım. Kontrol edip gönderin.
        </p>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse bg-white rounded-2xl" />}>
        <EventSubmitForm />
      </Suspense>
    </main>
  )
}
