import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { EventCard } from '@/components/events/EventCard'
import { EventFilters } from '@/components/events/EventFilters'
import type { Tables } from '@/types/database'

type Event = Tables<'events'>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

function getParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const val = params[key]
  return typeof val === 'string' ? val : ''
}

/**
 * Kullanıcının ilgi alanlarını al:
 * - Login ise: profiles.interests
 * - Misafir ise: cookie listur_interests (useInterests hook'u localStorage ile birlikte yazar)
 */
async function getUserInterests(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('interests')
      .eq('id', user.id)
      .single()
    return (profile?.interests as string[] | null) ?? []
  }

  // Misafir → cookie
  const cookieStore = await cookies()
  const raw = cookieStore.get('listur_interests')?.value
  if (!raw) return []
  try {
    const parsed = JSON.parse(decodeURIComponent(raw))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function getEvents(searchParams: Record<string, string | string[] | undefined>): Promise<Event[]> {
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('start_date', { ascending: true })

  const kategori = getParam(searchParams, 'kategori')
  if (kategori) query = query.eq('category', kategori)

  const sehir = getParam(searchParams, 'sehir')
  if (sehir) query = query.eq('city', sehir)

  const format = getParam(searchParams, 'format')
  if (format === 'online') query = query.eq('is_online', true)
  else if (format === 'yuzyuze') query = query.eq('is_online', false)

  const tarih = getParam(searchParams, 'tarih')
  const now = new Date()
  if (tarih === 'bugun') {
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    query = query.gte('start_date', now.toISOString()).lte('start_date', end.toISOString())
  } else if (tarih === 'bu-hafta') {
    const end = new Date(now)
    end.setDate(end.getDate() + (7 - end.getDay()))
    end.setHours(23, 59, 59, 999)
    query = query.gte('start_date', now.toISOString()).lte('start_date', end.toISOString())
  } else if (tarih === 'bu-ay') {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    query = query.gte('start_date', now.toISOString()).lte('start_date', end.toISOString())
  }

  const { data, error } = await query.limit(60)
  if (error) {
    console.error('Events fetch error:', error)
    return []
  }
  return data ?? []
}

/**
 * Etkinlikleri ilgi alanına göre sırala:
 * - Önce: kategorisi interests'e dahil olanlar (start_date ASC içinde)
 * - Sonra: diğerleri (start_date ASC)
 */
function rankByInterests(events: Event[], interests: string[]): { featured: Event[]; rest: Event[] } {
  if (interests.length === 0) {
    return { featured: [], rest: events }
  }
  const interestSet = new Set(interests)
  const featured: Event[] = []
  const rest: Event[] = []
  for (const event of events) {
    if (interestSet.has(event.category)) {
      featured.push(event)
    } else {
      rest.push(event)
    }
  }
  return { featured, rest }
}

export default async function AnaSayfa({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const [events, userInterests] = await Promise.all([
    getEvents(params),
    getUserInterests(),
  ])

  const hasFilters = !!(
    getParam(params, 'kategori') ||
    getParam(params, 'sehir') ||
    getParam(params, 'format') ||
    getParam(params, 'tarih')
  )

  // Filtre aktifse interests öne çıkarmayı atla (zaten kullanıcı manuel filtreliyor)
  const { featured, rest } = hasFilters
    ? { featured: [], rest: events }
    : rankByInterests(events, userInterests)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
          Türkiye&apos;nin Teknoloji Etkinlikleri
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Hackathon, meetup, workshop ve konferansları keşfet. Toplulukla buluş.
        </p>
      </div>

      {/* Filtreler */}
      <div className="mb-8">
        <Suspense fallback={<div className="h-16 animate-pulse bg-white rounded-2xl" />}>
          <EventFilters />
        </Suspense>
      </div>

      {/* Etkinlik listesi */}
      {events.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          {featured.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Sizin için öne çıkanlar</h2>
                <span className="text-xs text-gray-400">İlgi alanlarınıza uygun</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featured.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          <section>
            {featured.length > 0 && (
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tüm etkinlikler</h2>
            )}
            <p className="text-sm text-gray-400 mb-4">{events.length} etkinlik bulundu</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">
        {hasFilters ? 'Bu kriterlere uygun etkinlik yok' : 'Henüz etkinlik eklenmemiş'}
      </h2>
      <p className="text-gray-400 text-sm">
        {hasFilters ? 'Farklı filtreler deneyin.' : 'İlk etkinliği siz ekleyebilirsiniz!'}
      </p>
    </div>
  )
}
