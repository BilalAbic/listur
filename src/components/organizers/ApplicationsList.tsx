'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Application {
  id: string
  user_id: string
  requested_handle: string
  bio: string | null
  website: string | null
  twitter: string | null
  github: string | null
  reason: string | null
  status: string
  created_at: string
  reviewed_at: string | null
  rejection_note: string | null
  applicant: { name: string; email: string } | null
}

interface Props {
  applications: Application[]
  /** true ise approve/reject butonları render edilir (open list); false ise read-only (geçmiş) */
  actionable: boolean
}

export function ApplicationsList({ applications, actionable }: Props) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">
        {actionable ? 'Açık başvuru yok.' : 'Henüz işlem geçmişi yok.'}
      </div>
    )
  }

  const handleApprove = async (id: string) => {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/organizers/applications/${id}/approve`, {
        method: 'PATCH',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Onaylanamadı.')
      } else {
        router.refresh()
      }
    } catch {
      setError('Beklenmedik bir hata.')
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (id: string) => {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/organizers/applications/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_note: rejectNote }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Reddedilemedi.')
      } else {
        setRejectingId(null)
        setRejectNote('')
        router.refresh()
      }
    } catch {
      setError('Beklenmedik bir hata.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {applications.map((app) => (
        <div
          key={app.id}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-gray-900">@{app.requested_handle}</span>
                {!actionable && app.rejection_note !== null && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                    Reddedildi
                  </span>
                )}
                {!actionable && app.rejection_note === null && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                    Onaylandı
                  </span>
                )}
              </div>
              {app.applicant && (
                <p className="text-sm text-gray-600">
                  {app.applicant.name || '(isimsiz)'} · {app.applicant.email}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Başvuru:{' '}
                {new Date(app.created_at).toLocaleDateString('tr-TR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>

            {actionable && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleApprove(app.id)}
                  disabled={busyId === app.id}
                  className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Onayla
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectingId(app.id)
                    setRejectNote('')
                  }}
                  disabled={busyId === app.id}
                  className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  Reddet
                </button>
              </div>
            )}
          </div>

          {/* Profil önizleme */}
          {app.bio && <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">{app.bio}</p>}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
            {app.website && (
              <span>🌐 {app.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
            )}
            {app.twitter && <span>𝕏 @{app.twitter}</span>}
            {app.github && <span>👨‍💻 {app.github}</span>}
          </div>
          {app.reason && (
            <div className="mt-3 text-sm text-gray-700">
              <p className="text-xs font-semibold text-gray-500 mb-1">Neden:</p>
              <p className="whitespace-pre-line">{app.reason}</p>
            </div>
          )}

          {/* Reject modal inline */}
          {rejectingId === app.id && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
              <label className="block text-xs font-semibold text-red-800 mb-2">
                Red gerekçesi (kullanıcıya bildirilir, isteğe bağlı)
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Örn: Etkinlik geçmişi yetersiz; gönderdiğin link aktif değil…"
                className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingId(null)
                    setRejectNote('')
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:text-gray-900"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(app.id)}
                  disabled={busyId === app.id}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  Reddet
                </button>
              </div>
            </div>
          )}

          {/* Geçmiş kayıtlar için rejection_note göster */}
          {!actionable && app.rejection_note && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 text-sm text-red-800">
              <span className="font-medium">Red notu:</span> {app.rejection_note}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
