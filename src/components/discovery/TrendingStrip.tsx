import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTrendingFeed } from '@/lib/feeds'
import { EventCard } from '@/components/events/EventCard'

/**
 * Ana sayfa için "Şu an gündemde" yatay şeridi.
 *
 * Sprint 6 — engagement skoruna göre ilk 4 etkinlik. Yaklaşan etkinlik
 * yoksa veya hiç engagement yoksa hiç render edilmez (null döner).
 */
export async function TrendingStrip() {
  const supabase = await createClient()
  const events = await getTrendingFeed(supabase, { limit: 4 })

  // Hiç etkinlik yoksa veya hepsi 0 skorluysa görmemezden gel
  if (events.length === 0 || events.every((e) => e._score === 0)) {
    return null
  }

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 text-white">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.5 0a8.5 8.5 0 0 0-8 11.5 4 4 0 0 0-2.5 3.7C3 19 6 22 9.5 22h7c4.4 0 7.5-3.6 7.5-8 0-2.7-1.5-5-3.7-6.3A8.5 8.5 0 0 0 13.5 0z"/>
            </svg>
          </span>
          <h2 className="text-lg font-semibold text-gray-900">Şu an gündemde</h2>
        </div>
        <Link
          href="/kesfet/trending"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Tümünü gör →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {events.map((event, idx) => (
          <div key={event.id} className="relative">
            {idx === 0 && (
              <div className="absolute -top-2 -left-2 z-10 px-2.5 py-1 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white text-[10px] font-bold uppercase tracking-wide shadow-md ring-2 ring-white">
                #1 Trend
              </div>
            )}
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </section>
  )
}
