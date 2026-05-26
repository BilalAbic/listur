'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { INTEREST_CATEGORIES } from '@/types/index'
import type { ParsedEventData } from '@/types/index'

export function EventSubmitForm() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [parsedData, setParsedData] = useState<Partial<ParsedEventData> | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const [venueName, setVenueName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [registrationUrl, setRegistrationUrl] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message: string
    slug?: string
  } | null>(null)

  const handleParseLink = async () => {
    if (!url) return
    setParsing(true)
    setParseError('')
    setParsedData(null)

    try {
      const res = await fetch('/api/parse-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await res.json()

      if (!res.ok) {
        setParseError(data.error ?? 'Parse ba?ar?s?z. Manuel doldurabilirsiniz.')
        return
      }

      // Form alanlar?n? doldur
      setParsedData(data)
      if (data.title) setTitle(data.title)
      if (data.description) setDescription(data.description.slice(0, 500))
      if (data.category) setCategory(data.category)
      if (data.city) setCity(data.city)
      if (data.is_online !== undefined) setIsOnline(data.is_online)
      if (data.venue_name) setVenueName(data.venue_name)
      if (data.start_date) {
        // ISO 8601 ? datetime-local format
        setStartDate(data.start_date.slice(0, 16))
      }
      if (data.end_date) setEndDate(data.end_date.slice(0, 16))
      if (data.registration_url) setRegistrationUrl(data.registration_url)
    } catch {
      setParseError('Ba?lant? hatas?. L?tfen tekrar deneyin.')
    } finally {
      setParsing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          city: isOnline ? null : city,
          is_online: isOnline,
          venue_name: isOnline ? null : venueName,
          start_date: startDate ? new Date(startDate).toISOString() : undefined,
          end_date: endDate ? new Date(endDate).toISOString() : undefined,
          registration_url: registrationUrl || undefined,
          source_url: url,
          cover_image_og: parsedData?.cover_image ?? undefined,
          parse_source: parsedData?.parse_source ?? 'manual',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSubmitResult({ success: false, message: data.error ?? 'G?nderim ba?ar?s?z.' })
      } else {
        setSubmitResult({
          success: true,
          message: data.message,
          slug: data.event?.slug,
        })
      }
    } catch {
      setSubmitResult({ success: false, message: 'Ba?lant? hatas?.' })
    } finally {
      setSubmitting(false)
    }
  }

  // Ba?ar?l? g?nderim ekran?
  if (submitResult?.success) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Etkinlik G?nderildi!</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">{submitResult.message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setSubmitResult(null)
              setUrl('')
              setParsedData(null)
              setTitle('')
              setDescription('')
              setCategory('')
              setCity('')
              setIsOnline(false)
              setVenueName('')
              setStartDate('')
              setEndDate('')
              setRegistrationUrl('')
            }}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Yeni Etkinlik Ekle
          </button>
          {submitResult.slug && (
            <button
              onClick={() => router.push(`/etkinlik/${submitResult.slug}`)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Etkinli?i G?r?nt?le
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Ad?m 1: Link gir */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Ad?m 1 ? Etkinlik Linki</h2>
        <p className="text-sm text-gray-500 mb-4">
          Etkinlik sayfas?n?n URL&apos;sini yap??t?r?n. Bilgileri otomatik dolduraca??z.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://etkinlik.com/hackathon-2026"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleParseLink()}
          />
          <button
            onClick={handleParseLink}
            disabled={!url || parsing}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {parsing ? 'Getiriliyor?' : 'Bilgileri Getir'}
          </button>
        </div>
        {parseError && (
          <p className="mt-2 text-sm text-amber-600">{parseError} Manuel doldurabilirsiniz.</p>
        )}
        {parsedData && (
          <p className="mt-2 text-sm text-green-600">
            ? Bilgiler getirildi ({parsedData.parse_source === 'gpt4o' ? 'AI yard?m?yla' : 'otomatik'}). Kontrol edip d?zenleyebilirsiniz.
          </p>
        )}
      </section>

      {/* Ad?m 2: Form */}
      <form onSubmit={handleSubmit}>
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-800">Ad?m 2 ? Etkinlik Bilgileri</h2>

          {/* Ba?l?k */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ba?l?k <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              required placeholder="Etkinlik ba?l???"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* A??klama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">A??klama</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Etkinlik hakk?nda k?sa bir a??klama (max 500 karakter)"
              maxLength={500} rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{description.length}/500</p>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              value={category} onChange={(e) => setCategory(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            >
              <option value="">Se?in?</option>
              {INTEREST_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Online / Y?z y?ze */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Online etkinlik</span>
            </label>
          </div>

          {/* ?ehir + Mekan (y?z y?ze ise) */}
          {!isOnline && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">?ehir</label>
                <input
                  type="text" value={city} onChange={(e) => setCity(e.target.value)}
                  placeholder="?stanbul"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mekan</label>
                <input
                  type="text" value={venueName} onChange={(e) => setVenueName(e.target.value)}
                  placeholder="ATO Congresium"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          )}

          {/* Tarihler */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ba?lang?? <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Biti?</label>
              <input
                type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Kay?t linki */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kay?t / Bilet Linki</label>
            <input
              type="url" value={registrationUrl} onChange={(e) => setRegistrationUrl(e.target.value)}
              placeholder="https://kayit.com/etkinlik"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* G?nder */}
          {submitResult && !submitResult.success && (
            <p className="text-sm text-red-600">{submitResult.message}</p>
          )}
          <button
            type="submit" disabled={submitting || !title || !category || !startDate || !url}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'G?nderiliyor?' : 'Etkinli?i G?nder'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Etkinli?iniz moderat?r onay?ndan sonra yay?nlanacakt?r.
          </p>
        </section>
      </form>
    </div>
  )
}
