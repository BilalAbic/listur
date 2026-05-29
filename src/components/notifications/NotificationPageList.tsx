'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface NotificationItem {
  id: string
  type: string
  created_at: string
  read_at: string | null
  event_id: string | null
  events: {
    id: string
    title: string
    slug: string
    cover_image: string | null
  } | null
}

interface Props {
  notifications: NotificationItem[]
}

const typeConfig: Record<string, { icon: string; label: string; color: string }> = {
  new_event: { icon: '🔔', label: 'Yeni etkinlik', color: 'bg-indigo-50' },
  submission_approved: { icon: '✅', label: 'Etkinliğiniz onaylandı', color: 'bg-green-50' },
  submission_rejected: { icon: '❌', label: 'Etkinliğiniz reddedildi', color: 'bg-red-50' },
  report_resolved: { icon: '🔍', label: 'Raporunuz incelendi', color: 'bg-yellow-50' },
  event_reminder: { icon: '⏰', label: 'Etkinlik yaklaşıyor', color: 'bg-amber-50' },
}

export function NotificationPageList({ notifications }: Props) {
  const router = useRouter()
  const [markingAll, setMarkingAll] = useState(false)
  const [localRead, setLocalRead] = useState<Set<string>>(
    new Set(notifications.filter((n) => n.read_at).map((n) => n.id))
  )

  const markAsRead = async (id: string) => {
    if (localRead.has(id)) return
    setLocalRead((prev) => new Set([...prev, id]))
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
  }

  const markAllAsRead = async () => {
    setMarkingAll(true)
    setLocalRead(new Set(notifications.map((n) => n.id)))
    await fetch('/api/notifications/read-all', { method: 'PATCH' })
    setMarkingAll(false)
    router.refresh()
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">
          🔔
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Henüz bildirim yok</h3>
        <p className="text-sm text-gray-500">İlgi alanlarınıza uygun etkinlikler paylaşıldığında bildirim alacaksınız.</p>
      </div>
    )
  }

  const hasUnread = notifications.some((n) => !localRead.has(n.id))

  return (
    <div>
      {hasUnread && (
        <div className="flex justify-end mb-4">
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="text-sm text-indigo-600 hover:underline disabled:opacity-50"
          >
            {markingAll ? 'İşleniyor…' : 'Tümünü okundu işaretle'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notif) => {
          const isRead = localRead.has(notif.id)
          const config = typeConfig[notif.type] ?? { icon: '🔔', label: notif.type, color: 'bg-gray-50' }
          const href = notif.events?.slug ? `/etkinlik/${notif.events.slug}` : '#'

          return (
            <Link
              key={notif.id}
              href={href}
              onClick={() => markAsRead(notif.id)}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm ${
                isRead ? 'border-gray-100 bg-white' : `border-indigo-200 ${config.color}`
              }`}
            >
              {/* İkon */}
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                {config.icon}
              </div>

              {/* İçerik */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                    {config.label}
                  </p>
                  {!isRead && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
                {notif.events?.title && (
                  <p className="text-sm text-gray-600 truncate mt-0.5">{notif.events.title}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notif.created_at).toLocaleDateString('tr-TR', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
