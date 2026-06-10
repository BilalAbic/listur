/**
 * Feed kompozisyon mantığı — Sprint 6 (Trending + Sana Özel)
 *
 * Bu dosya hem API route'lar (/api/feed/*) hem de server component'ler
 * (/kesfet/*) tarafından kullanılır. Tek kaynak — skorlama mantığını
 * iki yerde tekrar yazmayalım.
 *
 * Engagement skoru events tablosunda denormalize edildiği için (Sprint 1,
 * migration 005) JOIN gerekmez. Indeks: idx_events_engagement_score.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/types/database'

type Event = Tables<'events'>
export type ScoredEvent = Event & { _score: number }

/** Engagement skoru: view*1 + favorite*3 + rsvp*5 */
export function engagementScore(event: Pick<Event, 'view_count' | 'favorite_count' | 'rsvp_count'>): number {
  return event.view_count + event.favorite_count * 3 + event.rsvp_count * 5
}

interface TrendingOptions {
  /** Dönecek maksimum etkinlik. Default: 20 */
  limit?: number
  /** Aday havuz boyutu (DB'den çekilen). Default: 100 */
  pool?: number
}

/**
 * Trending feed: yaklaşan yayında etkinlikler, engagement skoruna göre sıralı.
 *
 * Pool'dan limit kadar etkinlik döner. PostgREST `order(expression)` desteklemediği
 * için skor JS tarafında hesaplanıp sıralanır — pool yeterince büyük olmalı.
 */
export async function getTrendingFeed(
  supabase: SupabaseClient<Database>,
  options: TrendingOptions = {}
): Promise<ScoredEvent[]> {
  const limit = options.limit ?? 20
  const pool = options.pool ?? 100

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(pool)

  if (error) {
    console.error('[feeds.getTrendingFeed] query error:', error.message)
    return []
  }

  const scored: ScoredEvent[] = (data ?? [])
    .map((e) => ({ ...e, _score: engagementScore(e) }))
    .sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score
      // Eşit skorda: önce başlayan yukarı
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    })

  return scored.slice(0, limit)
}

interface ForYouOptions {
  /** Dönecek maksimum etkinlik. Default: 30 */
  limit?: number
  /** Aday havuz boyutu. Default: 200 */
  pool?: number
}

/**
 * For-You feed: kullanıcının interests + takip ettiği organizatörlere göre
 * kişiselleştirilmiş yaklaşan etkinlikler.
 *
 * Skor bileşenleri:
 *  - İlgi alanı eşleşmesi (category): +5
 *  - Takip edilen organizatör eşleşmesi: +10
 *  - Engagement boost: skor * 0.1
 *
 * Hiç eşleşme yoksa boş dönerse fallback olarak trending'e benzer engagement
 * sıralaması uygulanır — kullanıcı yine de görsün diye.
 */
export async function getForYouFeed(
  supabase: SupabaseClient<Database>,
  userId: string,
  options: ForYouOptions = {}
): Promise<ScoredEvent[]> {
  const limit = options.limit ?? 30
  const pool = options.pool ?? 200

  // Paralel: profile + follows + events
  const [profileResult, followsResult, eventsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('interests')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('organizer_follows')
      .select('organizer_id')
      .eq('follower_id', userId),
    supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(pool),
  ])

  if (eventsResult.error) {
    console.error('[feeds.getForYouFeed] events query error:', eventsResult.error.message)
    return []
  }

  const interests = new Set<string>((profileResult.data?.interests as string[] | null) ?? [])
  const followedOrganizers = new Set<string>(
    (followsResult.data ?? []).map((f) => f.organizer_id)
  )

  const events = eventsResult.data ?? []

  const scored: ScoredEvent[] = events.map((e) => {
    let score = 0

    // İlgi alanı eşleşmesi
    if (interests.has(e.category)) {
      score += 5
    }

    // Takip edilen organizatör
    if (e.organizer_id && followedOrganizers.has(e.organizer_id)) {
      score += 10
    }

    // Engagement boost — popüler etkinlikleri öne çıkar ama hâkim olmasın
    score += engagementScore(e) * 0.1

    return { ...e, _score: score }
  })

  // Hiç kişiselleştirme yoksa kullanıcı yine de bir şey görsün — engagement DESC
  const hasPersonalization = interests.size > 0 || followedOrganizers.size > 0
  const filtered = hasPersonalization
    ? scored.filter((e) => e._score > 0.5) // engagement boost'tan dolayı eşik
    : scored

  return filtered
    .sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    })
    .slice(0, limit)
}
