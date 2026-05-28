'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ModerationActionModal } from '@/components/modals/ModerationActionModal'
import type { Database } from '@/types/database'

type EventRow = Database['public']['Tables']['events']['Row'] & {
  profiles: { name: string | null; email: string } | null
}

interface Props {
  events: EventRow[]
}

export function PendingEventsList({ events }: Props) {
  const router = useRouter()
  const [modal, setModal] = useState<{
    eventId: string
    eventTitle: string
    action: 'approve' | 'reject' | 'remove'
  } | null>(null)

  const handleSuccess = () => {
    setModal(null)
    router.refresh()
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Kuyruk temiz!</h3>
        <p className="text-sm text-gray-500">Onay bekleyen etkinlik yok.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Görsel */}
              {event.cover_image_og && (
                <img
                  src={event.cover_image_og}
                  alt=""
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}

              {/* İçerik */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {event.profiles?.name ?? 'Bilinmeyen'} · {event.profiles?.email}
                    </p>
                  </div>
                  <span className="flex-shrink-0 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {event.category}
                  </span>
                </div>

                {event.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(event.start_date).toLocaleDateString('tr-TR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                  {event.city && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {event.city}
                    </span>
                  )}
                  {event.is_online && (
                    <span className="flex items-center gap-1 text-indigo-600">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Online
                    </span>
                  )}
                  <span className="text-gray-400">
                    {new Date(event.created_at).toLocaleDateString('tr-TR')} gönderildi
                  </span>
                </div>

                {event.source_url && (
                  <a
                    href={event.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-600 hover:underline"
                  >
                    Kaynak linki aç ↗
                  </a>
                )}
              </div>
            </div>

            {/* Aksiyon butonları */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setModal({ eventId: event.id, eventTitle: event.title, action: 'approve' })}
                className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
              >
                ✓ Onayla
              </button>
              <button
                onClick={() => setModal({ eventId: event.id, eventTitle: event.title, action: 'reject' })}
                className="flex-1 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold transition-colors"
              >
                ✗ Reddet
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <ModerationActionModal
          eventId={modal.eventId}
          eventTitle={modal.eventTitle}
          action={modal.action}
          onSuccess={handleSuccess}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  )
}
