'use client'

import { useState } from 'react'

interface Props {
  eventId: string
  eventTitle: string
  action: 'approve' | 'reject' | 'remove'
  onSuccess: () => void
  onCancel: () => void
}

export function ModerationActionModal({ eventId, eventTitle, action, onSuccess, onCancel }: Props) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const config = {
    approve: {
      title: 'Etkinliği Onayla',
      description: `"${eventTitle}" etkinliğini yayınlıyorsunuz.`,
      buttonLabel: 'Onayla ve Yayınla',
      buttonClass: 'bg-green-600 hover:bg-green-700',
      endpoint: 'approve',
      noteLabel: 'Not (opsiyonel)',
    },
    reject: {
      title: 'Etkinliği Reddet',
      description: `"${eventTitle}" etkinliği reddedilecek. Gönderici bildirim alacak.`,
      buttonLabel: 'Reddet',
      buttonClass: 'bg-red-600 hover:bg-red-700',
      endpoint: 'reject',
      noteLabel: 'Ret sebebi (gönderici görecek)',
    },
    remove: {
      title: 'Etkinliği Kaldır',
      description: `"${eventTitle}" yayından kaldırılacak.`,
      buttonLabel: 'Kaldır',
      buttonClass: 'bg-red-600 hover:bg-red-700',
      endpoint: 'remove',
      noteLabel: 'Kaldırma sebebi',
    },
  }[action]

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const res = await fetch(`/api/events/${eventId}/${config.endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        action === 'reject' ? { rejection_note: note } : { note }
      ),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'İşlem başarısız.')
      setLoading(false)
      return
    }

    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{config.title}</h3>
        <p className="text-sm text-gray-500 mb-5">{config.description}</p>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">{config.noteLabel}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-colors ${config.buttonClass}`}
          >
            {loading ? 'İşleniyor…' : config.buttonLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
