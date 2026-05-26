'use client'

import { useState } from 'react'

interface Props {
  eventId: string
  eventTitle: string
  onClose: () => void
}

const REASONS = [
  { value: 'misleading', label: 'Yan?lt?c? bilgi', description: 'Tarih, konum veya i?erik yanl??' },
  { value: 'spam', label: 'Spam', description: 'Reklam ama?l? veya tekrar eden i?erik' },
  { value: 'irrelevant', label: 'Konuyla alakas?z', description: 'Teknoloji etkinli?i de?il' },
  { value: 'inappropriate', label: 'Uygunsuz', description: 'Kural d??? veya zararl? i?erik' },
  { value: 'other', label: 'Di?er', description: 'Yukar?dakilere girmeyen ba?ka bir sorun' },
]

export function ReportModal({ eventId, eventTitle, onClose }: Props) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      setError('L?tfen bir sebep se?in.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, reason, description: description.trim() || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Rapor g?nderilemedi.')
        return
      }

      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {success ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Raporunuz Al?nd?</h3>
            <p className="text-sm text-gray-500 mb-5">Ekibimiz en k?sa s?rede inceleyecek.</p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
            >
              Kapat
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Uygunsuz ??erik Bildir</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[280px]">{eventTitle}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    reason === r.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      reason === r.value ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                    }`}>
                      {reason === r.value && (
                        <div className="w-full h-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.label}</p>
                      <p className="text-xs text-gray-500">{r.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ek a??klama <span className="text-gray-400 font-normal">(opsiyonel)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Daha fazla detay payla??n?"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
              >
                ?ptal
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !reason}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? 'G?nderiliyor?' : 'Rapor Et'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
