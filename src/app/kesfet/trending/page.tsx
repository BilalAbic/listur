import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTrendingFeed } from '@/lib/feeds'
import { EventCard } from '@/components/events/EventCard'

export const metadata: Metadata = {
  title: 'Trend Etkinlikler',
  description:
    "Şu an gündemde olan teknoloji etkinlikleri. En çok ilgi gören hackathon, meetup ve konferanslar.",
}

export const revalidate = 300 // 5 dakika ISR

export default async function TrendingPage() {
  const supabase = await createClient()
  const events = await getTrendingFeed(supabase, { limit: 30 })

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.5 0a8.5 8.5 0 0 0-8 11.5 4 4 0 0 0-2.5 3.7C3 19 6 22 9.5 22h7c4.4 0 7.5-3.6 7.5-8 0-2.7-1.5-5-3.7-6.3A8.5 8.5 0 0 0 13.5 0z"/>
            </svg>
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900">Trend Etkinlikler</h1>
        </div>
        <p className="text-gray-500">
          Şu an en çok ilgi gören etkinlikler. Sıralama; görüntülenme, favori ve katılım oranlarına göre belirlenir.
        </p>
      </div>

      {/* Liste */}
      {events.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">{events.length} etkinlik gündemde</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event, idx) => (
              <div key={event.id} className="relative">
                {/* Sıra rozeti — ilk 3 için */}
                {idx < 3 && (
                  <div className="absolute -top-2 -left-2 z-10 w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white text-sm font-bold flex items-center justify-center shadow-md ring-2 ring-white">
                    {idx + 1}
                  </div>
                )}
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* CTA — sana özel feed'e yönlendirme */}
      <div className="mt-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 sm:p-8 text-center">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          Sana özel etkinlikler ister misin?
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          İlgi alanlarına ve takip ettiğin organizatörlere göre kişiselleştirilmiş feed.
        </p>
        <Link
          href="/kesfet/sana-ozel"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Sana Özel&apos;i Aç
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-10 h-10 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Şu an gündemde etkinlik yok</h2>
      <p className="text-gray-400 text-sm mb-6">Yaklaşan etkinlikler ilgi topladıkça burada görünecek.</p>
      <Link
        href="/"
        className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
      >
        Tüm Etkinlikleri Gör
      </Link>
    </div>
  )
}
