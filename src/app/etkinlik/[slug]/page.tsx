import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient, createAdminClient } from '@/lib/supabase/server'

type Params = Promise<{ slug: string }>

// SSG: T?m yay?ndaki etkinliklerin slug'lar?n? ?nceden ?ret
// NOT: generateStaticParams build zaman?nda ?al???r, cookies() kullanamaz
// createAdminClient service_role key ile ?al???r, cookie gerektirmez
export async function generateStaticParams() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('events')
    .select('slug')
    .eq('status', 'published')

  return (data ?? []).map((e) => ({ slug: e.slug }))
}

// OG metadata ?ret
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select('title, description, cover_image, category, city, start_date')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!event) return { title: 'Etkinlik Bulunamad?' }

  const title = `${event.title}`
  const description = event.description?.slice(0, 160) ?? `${event.category} etkinli?i ? ${event.city ?? 'Online'}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: event.cover_image ? [{ url: event.cover_image }] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: event.cover_image ? [event.cover_image] : [],
    },
  }
}

function formatDate(dateStr: string, includeTime = false): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

const categoryColors: Record<string, string> = {
  'Yapay Zeka / ML': 'bg-purple-100 text-purple-700',
  'Blockchain / Web3': 'bg-orange-100 text-orange-700',
  'Mobil Geli?tirme': 'bg-blue-100 text-blue-700',
  'Backend / DevOps': 'bg-green-100 text-green-700',
  'Siber G?venlik': 'bg-red-100 text-red-700',
  'Giri?imcilik / Startup': 'bg-yellow-100 text-yellow-700',
  'Tasar?m / UX': 'bg-pink-100 text-pink-700',
  'Oyun Geli?tirme': 'bg-indigo-100 text-indigo-700',
  'Veri Bilimi': 'bg-teal-100 text-teal-700',
  'A??k Kaynak': 'bg-emerald-100 text-emerald-700',
}

export default async function EtkinlikDetay({ params }: { params: Params }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!event) notFound()

  const catColor = categoryColors[event.category] ?? 'bg-gray-100 text-gray-600'
  const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL}/etkinlik/${slug}`

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      {/* Kapak g?rseli */}
      {event.cover_image && (
        <div className="relative h-72 rounded-2xl overflow-hidden mb-8 shadow-md">
          <Image
            src={event.cover_image}
            alt={event.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {/* Kategori + Online etiketi */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${catColor}`}>
          {event.category}
        </span>
        {event.is_online && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
            Online
          </span>
        )}
      </div>

      {/* Ba?l?k */}
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 leading-tight">
        {event.title}
      </h1>

      {/* Meta bilgiler */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tarih */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Ba?lang??</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(event.start_date, true)}</p>
            {event.end_date && (
              <p className="text-xs text-gray-500 mt-0.5">Son: {formatDate(event.end_date, true)}</p>
            )}
          </div>
        </div>

        {/* Konum */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Konum</p>
            <p className="text-sm font-semibold text-gray-900">
              {event.is_online ? 'Online' : event.city ?? 'Belirtilmemi?'}
            </p>
            {event.venue_name && (
              <p className="text-xs text-gray-500 mt-0.5">{event.venue_name}</p>
            )}
          </div>
        </div>
      </div>

      {/* A??klama */}
      {event.description && (
        <div className="prose prose-gray max-w-none mb-8">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{event.description}</p>
        </div>
      )}

      {/* Eylem butonlar? */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        {event.registration_url && (
          <a
            href={event.registration_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Kay?t Ol ?
          </a>
        )}
        <ShareButtons title={event.title} url={eventUrl} />
      </div>

      {/* Kaynak link */}
      {event.source_url && (
        <p className="text-xs text-gray-400 text-center">
          Kaynak:{' '}
          <a href={event.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 underline">
            {new URL(event.source_url).hostname}
          </a>
        </p>
      )}

      {/* Rapor butonu */}
      <div className="mt-8 text-center">
        <a
          href={`/etkinlik/${slug}/rapor`}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Uygunsuz i?erik bildir
        </a>
      </div>
    </article>
  )
}

// Payla? butonlar? ? sadece client gerekiyor
function ShareButtons({ title, url }: { title: string; url: string }) {
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`

  return (
    <div className="flex gap-2">
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Twitter
      </a>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        LinkedIn
      </a>
    </div>
  )
}
