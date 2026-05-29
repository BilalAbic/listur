'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ReportItem {
  id: string
  reason: string
  description: string | null
  status: string
  created_at: string
  reported_by: string | null
  reporter_ip: string | null
  events: {
    id: string
    title: string
    slug: string
    status: string
  } | null
}

interface Props {
  reports: ReportItem[]
  moderatorId: string
}

const reasonLabels: Record<string, string> = {
  misleading: 'Yanıltıcı',
  spam: 'Spam',
  irrelevant: 'İlgisiz',
  inappropriate: 'Uygunsuz',
  other: 'Diğer',
}

const reasonColors: Record<string, string> = {
  misleading: 'bg-yellow-100 text-yellow-700',
  spam: 'bg-red-100 text-red-700',
  irrelevant: 'bg-gray-100 text-gray-700',
  inappropriate: 'bg-orange-100 text-orange-700',
  other: 'bg-blue-100 text-blue-700',
}

export function ReportsList({ reports, moderatorId }: Props) {
  const router = useRouter()
  const [resolving, setResolving] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleResolve = async (reportId: string, action: 'dismiss' | 'remove_event', eventId?: string) => {
    setResolving(reportId)
    setError('')

    try {
      const res = await fetch(`/api/reports/${reportId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, event_id: eventId, moderator_id: moderatorId }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'İşlem başarısız.')
        return
      }

      router.refresh()
    } finally {
      setResolving(null)
    }
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Bekleyen rapor yok</h3>
        <p className="text-sm text-gray-500">Tüm raporlar incelenmiş.</p>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                      reasonColors[report.reason] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {reasonLabels[report.reason] ?? report.reason}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(report.created_at).toLocaleDateString('tr-TR', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                {report.events ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{report.events.title}</span>
                    <a
                      href={`/etkinlik/${report.events.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Görüntüle ↗
                    </a>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500 italic">Etkinlik bulunamadı (silinmiş olabilir)</span>
                )}
                {report.reported_by && (
                  <p className="text-xs text-gray-500 mt-0.5">Raporlayan: Kayıtlı kullanıcı</p>
                )}
              </div>
            </div>

            {report.description && (
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 mb-4">
                &ldquo;{report.description}&rdquo;
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleResolve(report.id, 'dismiss')}
                disabled={resolving === report.id}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {resolving === report.id ? 'İşleniyor…' : 'Görmezden Gel'}
              </button>
              {report.events && report.events.status === 'published' && (
                <button
                  onClick={() => handleResolve(report.id, 'remove_event', report.events!.id)}
                  disabled={resolving === report.id}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {resolving === report.id ? 'İşleniyor…' : 'Etkinliği Kaldır'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
