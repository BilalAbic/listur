import { cache } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { OrganizerHeader } from '@/components/organizers/OrganizerHeader'
import { EventCard } from '@/components/events/EventCard'

type Params = Promise<{ handle: string }>

export const dynamic = 'force-dynamic'

interface OrganizerProfile {
  id: string
  handle: string | null
  name: string
  bio: string | null
  website: string | null
  twitter: string | null
  github: string | null
  is_organizer: boolean
  verified_at: string | null
  follower_count: number
}

const fetchOrganizerByHandle = cache(
  async (handle: string): Promise<OrganizerProfile | null> => {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, handle, name, bio, website, twitter, github, is_organizer, verified_at, follower_count'
        )
        .eq('handle', handle)
        .maybeSingle()

      if (error) {
        console.error('fetchOrganizerByHandle failed:', error)
        return null
      }
      // Sadece organizer flag'i true olanları aç (Sprint 4 doğrulama
      // sonrası flag = true olur)
      if (!data || !data.is_organizer) return null
      return data
    } catch (e) {
      console.error('fetchOrganizerByHandle failed:', e)
      return null
    }
  }
)

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { handle } = await params
  const organizer = await fetchOrganizerByHandle(handle)

  if (!organizer) return { title: 'Organizatör Bulunamadı' }

  const title = `${organizer.name || '@' + handle}`
  const description =
    organizer.bio ?? `${organizer.name || handle} organizatörü Listur'da.`

  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title: `${title} — Listur`,
      description: description.slice(0, 160),
      type: 'profile',
    },
  }
}

export default async function OrganizatorSayfa({ params }: { params: Params }) {
  const { handle } = await params
  const organizer = await fetchOrganizerByHandle(handle)

  if (!organizer) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-7xl font-black text-gray-100 mb-4 select-none">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Organizatör Bulunamadı</h1>
        <p className="text-gray-500 mb-8 max-w-sm">
          @{handle} adıyla bir organizatör bulamadık. Doğrulanmış organizatörler bu sayfada görünür.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    )
  }

  // Organizatörün yayındaki etkinliklerini çek
  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', organizer.id)
    .eq('status', 'published')
    .order('start_date', { ascending: false })

  const eventList = events ?? []
  const now = Date.now()
  const upcoming = eventList.filter((e) => new Date(e.start_date).getTime() >= now)
  const past = eventList.filter((e) => new Date(e.start_date).getTime() < now)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <OrganizerHeader organizer={organizer} />

      {/* Yaklaşan etkinlikler */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          Yaklaşan Etkinlikler
          <span className="text-sm font-normal text-gray-500">({upcoming.length})</span>
        </h2>

        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-sm text-gray-500">
              Şu an yaklaşan etkinlik yok. Yeni etkinliklerden haberdar olmak için takip edin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Geçmiş etkinlikler */}
      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            Geçmiş Etkinlikler
            <span className="text-sm font-normal text-gray-500">({past.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 opacity-70">
            {past.map((event) => (
              <EventCard key={event.id} event={event} showFavoriteOverlay={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
