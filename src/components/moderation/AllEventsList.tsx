'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ModerationActionModal } from '@/components/modals/ModerationActionModal'

interface EventItem {
  id: string
  title: string
  category: string
  city: string | null
  status: string
  start_date: string
  created_at: string
  slug: string
  profiles: { name: string | null } | null
}

interface Props {
  events: EventItem[]
  currentStatus: string
  currentPage: number
  totalPages: number
}

const STATUS_TABS = [
  { value: 'published', label: 'Yayında' },
  { value: 'pending', label: 'Bekliyor' },
  { value: 'rejected', label: 'Reddedildi' },
  { value: 'removed', label: 'Kaldırıldı' },
  { value: 'all', label: 'Tümü' },
]

const statusBadge: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-orange-100 text-orange-700',
  removed: 'bg-red-100 text-red-700',
}

const statusLabel: Record<string, string> = {
  published: 'Yayında',
  pending: 'Bekliyor',
  rejected: 'Reddedildi',
  removed: 'Kaldırıldı',
}

export function AllEventsList({ events, currentStatus, currentPage, totalPages }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [modal, setModal] = useState<{
    eventId: string
    eventTitle: string
    action: 'approve' | 'reject' | 'remove'
  } | null>(null)

  const navigate = (status: string, page = 1) => {
    const params = new URLSearchParams({ status, page: String(page) })
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSuccess = () => {
    setModal(null)
    router.refresh()
  }

  return (
    <>
      {/* Filtre tabları */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => navigate(tab.value)}
            className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap px-3 ${
              currentStatus === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="py-16 text-center text-gray-500">Bu durumda etkinlik yok.</div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{event.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusBadge[event.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {statusLabel[event.status] ?? event.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>{event.category}</span>
                    {event.city && <span>· {event.city}</span>}
                    <span>
                      · {new Date(event.start_date).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                    {event.profiles?.name && (
                      <span className="text-gray-400">· {event.profiles.name}</span>
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
                  {event.status === 'pending' && (
                    <>
                      <button
                        onClick={() => setModal({ eventId: event.id, eventTitle: event.title, action: 'approve' })}
                        className="px-3 py-1.5 text-xs text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        Onayla
                      </button>
                      <button
                        onClick={() => setModal({ eventId: event.id, eventTitle: event.title, action: 'reject' })}
                        className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Reddet
                      </button>
                    </>
                  )}
                  {event.status === 'published' && (
                    <button
                      onClick={() => setModal({ eventId: event.id, eventTitle: event.title, action: 'remove' })}
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
      )}

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => navigate(currentStatus, currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Önceki
          </button>
          <span className="text-sm text-gray-500 px-2">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => navigate(currentStatus, currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sonraki →
          </button>
        </div>
      )}

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
