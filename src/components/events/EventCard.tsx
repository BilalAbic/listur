import Link from 'next/link'
import Image from 'next/image'
import type { Tables } from '@/types/database'
import { FavoriteButtonWrapper } from '@/components/engagement/FavoriteButtonWrapper'

type Event = Tables<'events'>

interface EventCardProps {
  event: Event
  /** Sağ-üst köşede favori ikonu göster. Default: true */
  showFavoriteOverlay?: boolean
}

const categoryColors: Record<string, string> = {
  'Yapay Zeka / ML': 'bg-purple-100 text-purple-700',
  'Blockchain / Web3': 'bg-orange-100 text-orange-700',
  'Mobil Geliştirme': 'bg-blue-100 text-blue-700',
  'Backend / DevOps': 'bg-green-100 text-green-700',
  'Siber Güvenlik': 'bg-red-100 text-red-700',
  'Girişimcilik / Startup': 'bg-yellow-100 text-yellow-700',
  'Tasarım / UX': 'bg-pink-100 text-pink-700',
  'Oyun Geliştirme': 'bg-indigo-100 text-indigo-700',
  'Veri Bilimi': 'bg-teal-100 text-teal-700',
  'Açık Kaynak': 'bg-emerald-100 text-emerald-700',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function EventCard({ event, showFavoriteOverlay = true }: EventCardProps) {
  const catColor = categoryColors[event.category] ?? 'bg-gray-100 text-gray-600'
  const isUpcoming = new Date(event.start_date) > new Date()

  return (
    <Link href={`/etkinlik/${event.slug}`} className="group block">
      <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col">
        {/* Kapak görseli */}
        <div className="relative h-44 bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden">
          {event.cover_image ? (
            <Image
              src={event.cover_image}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-12 h-12 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Favori overlay (sol-üst) */}
          {showFavoriteOverlay && (
            <FavoriteButtonWrapper
              eventId={event.id}
              variant="overlay"
              redirectTo={`/etkinlik/${event.slug}`}
            />
          )}
          {/* Online etiketi (sağ-üst) */}
          {event.is_online && (
            <span className="absolute top-3 right-3 bg-white/90 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
              Online
            </span>
          )}
        </div>

        {/* İçerik */}
        <div className="p-5 flex flex-col flex-1 gap-3">
          {/* Kategori etiketi */}
          <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full ${catColor}`}>
            {event.category}
          </span>

          {/* Başlık */}
          <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {event.title}
          </h3>

          {/* Meta bilgiler */}
          <div className="mt-auto space-y-1.5">
            {/* Tarih */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className={isUpcoming ? 'text-indigo-600 font-medium' : 'text-gray-400'}>
                {formatDate(event.start_date)}
              </span>
            </div>

            {/* Konum */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.is_online ? 'Online' : event.city ?? 'Belirtilmemiş'}</span>
            </div>
          </div>

          {/* Kayıt butonu */}
          {event.registration_url && (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 w-full text-center py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition-colors"
            >
              Kayıt Ol →
            </a>
          )}
        </div>
      </article>
    </Link>
  )
}
