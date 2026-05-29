'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ModerationActionModal } from '@/components/modals/ModerationActionModal'

interface EventItem {
  id: string
  title: string
  category: string
  start_date: string
  city: string | null
  status: string
  published_at: string | null
  slug: string
}

interface Props {
  events: EventItem[]
  logMap: Record<string, string>
}

export function ApprovedEventsList({ events, logMap }: Props) {
  const router = useRouter()
  const [modal, setModal] = useState<{
    eventId: string
    eventTitle: string
  } | null>(null)

  const handleSuccess = () => {
    setModal(null)
    router.refresh()
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Henüz onay yok</h3>
        <p className="text-sm text-gray-500">Bu hesapla onaylanmış etkinlik bulunamadı.</p>
      </div>
    )
  }

  const statusColor: Record<string, string> = {
    published: 'bg-green-100 text-green-700',
    removed: 'bg-red-100 text-red-700',
    rejected: 'bg-orange-100 text-orange-700',
    pending: 'bg-yellow-100 text-yellow-700',
  }

  const statusLabel: Record<string, string> = {
    published: 'Yayında',
    removed: 'Kaldırıldı',
    rejected: 'Reddedildi',
    pending: 'Bekliyor',
  }

  return (
    <>
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      statusColor[event.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {statusLabel[event.status] ?? event.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{event.category}</span>
                  {event.city && <span>· {event.city}</span>}
                  <span>
                    · {new Date(event.start_date).toLocaleDateString('tr-TR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                  {logMap[event.id] && (
                    <span className="text-gray-400">
                      · {new Date(logMap[event.id]).toLocaleDateString('tr-TR')} onaylandı
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`/etkinlik/${event.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Görüntüle
                </a>
                {event.status === 'published' && (
                  <button
                    onClick={() => setModal({ eventId: event.id, eventTitle: event.title })}
                    className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Kaldır
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <ModerationActionModal
          eventId={modal.eventId}
          eventTitle={modal.eventTitle}
          action="remove"
          onSuccess={handleSuccess}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  )
}
