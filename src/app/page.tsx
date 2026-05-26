import { Suspense } from 'react'
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

export default async function AnaSayfa({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const events = await getEvents(params)
  const hasFilters = !!(
    getParam(params, 'kategori') ||
    getParam(params, 'sehir') ||
    getParam(params, 'format') ||
    getParam(params, 'tarih')
  )

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
