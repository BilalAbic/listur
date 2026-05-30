import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EventCard } from '@/components/events/EventCard'
import { SearchBar } from '@/components/discovery/SearchBar'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  q?: string
  kategori?: string
  sehir?: string
  online?: string
}>

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  const { q } = await searchParams
  const trimmed = q?.trim() ?? ''
  if (!trimmed) return { title: 'Arama' }
  return {
    title: `"${trimmed}" araması`,
    description: `Listur'da "${trimmed}" için bulunan etkinlikler.`,
  }
}

export default async function AraSayfasi({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { q, kategori, sehir, online } = await searchParams
  const query = q?.trim() ?? ''

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Etkinlik Ara</h1>
        <p className="text-sm text-gray-500 mb-5">
          Türkçe karakter duyarsız arama. &quot;ankara hackathon&quot; gibi doğal cümle de yazabilirsin.
        </p>
        <SearchBar variant="wide" initialValue={query} />
      </header>

      {query.length < 2 ? (
        <EmptyHint />
      ) : (
        <SearchResults
          query={query}
          kategori={kategori ?? null}
          sehir={sehir ?? null}
          online={online ?? null}
        />
      )}
    </div>
  )
}

function EmptyHint() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">
      Aramaya başlamak için en az 2 karakter yaz.{' '}
      <Link href="/" className="text-indigo-600 underline">
        Ya da tüm etkinlikleri keşfet
      </Link>
      .
    </div>
  )
}

async function SearchResults({
  query,
  kategori,
  sehir,
  online,
}: {
  query: string
  kategori: string | null
  sehir: string | null
  online: string | null
}) {
  const supabase = await createClient()

  let q = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .textSearch('search_vector', query, {
      type: 'websearch',
      config: 'turkish_unaccent',
    })

  if (kategori) q = q.eq('category', kategori)
  if (sehir) q = q.eq('city', sehir)
  if (online === 'true') q = q.eq('is_online', true)
  else if (online === 'false') q = q.eq('is_online', false)

  q = q.order('start_date', { ascending: true }).limit(50)

  const { data, count, error } = await q

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-700">
        Arama yapılırken bir hata oluştu. Lütfen sorgunu sadeleştirip tekrar dene.
      </div>
    )
  }

  const events = data ?? []
  const total = count ?? 0

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <div className="text-5xl mb-3">🔍</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Eşleşme bulunamadı</h2>
        <p className="text-sm text-gray-500 mb-5">
          &quot;{query}&quot; için uygun etkinlik yok. Farklı anahtar kelime dene veya{' '}
          <Link href="/" className="text-indigo-600 underline">
            tüm etkinlikleri gez
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <>
      <p className="text-sm text-gray-500 mb-5">
        <strong className="text-gray-900">{total}</strong> sonuç bulundu
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </>
  )
}
