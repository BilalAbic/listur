import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getForYouFeed } from '@/lib/feeds'
import { EventCard } from '@/components/events/EventCard'

export const metadata: Metadata = {
  title: 'Sana Özel',
  description: 'İlgi alanlarına ve takip ettiğin organizatörlere göre seçilmiş etkinlikler.',
}

// Kullanıcıya özel — cache yok
export const dynamic = 'force-dynamic'

export default async function SanaOzelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/giris?redirect=/kesfet/sana-ozel')
  }

  // Kişiselleştirme verilerini de çek — boş durum mesajı için
  const [profileResult, followsResult, events] = await Promise.all([
    supabase
      .from('profiles')
      .select('interests, name')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('organizer_follows')
      .select('organizer_id', { count: 'exact', head: true })
      .eq('follower_id', user.id),
    getForYouFeed(supabase, user.id, { limit: 40 }),
  ])

  const interests = (profileResult.data?.interests as string[] | null) ?? []
  const followCount = followsResult.count ?? 0
  const userName = profileResult.data?.name?.split(' ')[0] ?? 'Sana'
  const hasPersonalization = interests.length > 0 || followCount > 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.075 9.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.673z" />
            </svg>
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900">{userName} Özel</h1>
        </div>
        <p className="text-gray-500">
          {hasPersonalization
            ? 'İlgi alanların ve takip ettiğin organizatörlere göre seçildi.'
            : 'Önce ilgi alanlarını seç veya organizatör takip et — sana göre etkinlikler burada çıksın.'}
        </p>
      </div>

      {/* Kişiselleştirme özeti */}
      {hasPersonalization && (
        <div className="mb-8 bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex flex-wrap items-center gap-3">
          {interests.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">İlgi alanın:</span>
              <span className="font-medium text-indigo-700">{interests.length} kategori</span>
            </div>
          )}
          {followCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Takip:</span>
              <span className="font-medium text-indigo-700">{followCount} organizatör</span>
            </div>
          )}
          <div className="ml-auto">
            <Link href="/profil" className="text-xs text-indigo-600 hover:underline">
              Tercihleri düzenle →
            </Link>
          </div>
        </div>
      )}

      {/* Liste */}
      {events.length === 0 ? (
        <EmptyState hasPersonalization={hasPersonalization} />
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">{events.length} etkinlik bulundu</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function EmptyState({ hasPersonalization }: { hasPersonalization: boolean }) {
  if (!hasPersonalization) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Henüz seçim yapmamışsın</h2>
        <p className="text-gray-500 text-sm mb-6">
          İlgi alanlarını seç ve sevdiğin organizatörleri takip et — sana özel öneriler burada çıksın.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/profil"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            İlgi Alanlarını Seç
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Etkinlikleri Keşfet
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Yakında etkinlik yok</h2>
      <p className="text-gray-500 text-sm mb-4">
        Tercihlerine uygun yaklaşan etkinlik bulunamadı.
      </p>
      <Link
        href="/kesfet/trending"
        className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
      >
        Trend Etkinlikleri Gör
      </Link>
    </div>
  )
}
