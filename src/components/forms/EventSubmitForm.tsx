'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { INTEREST_CATEGORIES } from '@/types/index'
import type { ParsedEventData } from '@/types/index'
import { TagInput } from '@/components/discovery/TagInput'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

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
  const [tags, setTags] = useState<string[]>([])

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
        setParseError(data.error ?? 'Parse başarısız. Manuel doldurabilirsiniz.')
        return
      }

      // Form alanlarını doldur
      setParsedData(data)
      if (data.title) setTitle(data.title)
      if (data.description) setDescription(data.description.slice(0, 500))
      if (data.category) setCategory(data.category)
      if (data.city) setCity(data.city)
      if (data.is_online !== undefined) setIsOnline(data.is_online)
      if (data.venue_name) setVenueName(data.venue_name)
      if (data.start_date) {
        // ISO 8601 → datetime-local format
        setStartDate(data.start_date.slice(0, 16))
      }
      if (data.end_date) setEndDate(data.end_date.slice(0, 16))
      if (data.registration_url) setRegistrationUrl(data.registration_url)
    } catch {
      setParseError('Bağlantı hatası. Lütfen tekrar deneyin.')
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
          tags: tags.length > 0 ? tags : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSubmitResult({ success: false, message: data.error ?? 'Gönderim başarısız.' })
      } else {
        setSubmitResult({
          success: true,
          message: data.message,
          slug: data.event?.slug,
        })
      }
    } catch {
      setSubmitResult({ success: false, message: 'Bağlantı hatası.' })
    } finally {
      setSubmitting(false)
    }
  }

  // Başarılı gönderim ekranı
  if (submitResult?.success) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Etkinlik Gönderildi!</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">{submitResult.message}</p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary"
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
              setTags([])
            }}
          >
            Yeni Etkinlik Ekle
          </Button>
          {submitResult.slug && (
            <Button onClick={() => router.push(`/etkinlik/${submitResult.slug}`)}>
              Etkinliği Görüntüle
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Adım 1: Link gir */}
      <Card className="mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Adım 1 — Etkinlik Linki</h2>
        <p className="text-sm text-gray-500 mb-4">
          Etkinlik sayfasının URL&apos;sini yapıştırın. Bilgileri otomatik dolduracağız.
        </p>
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://etkinlik.com/hackathon-2026"
              aria-label="Etkinlik linki"
              onKeyDown={(e) => e.key === 'Enter' && handleParseLink()}
            />
          </div>
          <Button onClick={handleParseLink} disabled={!url || parsing} className="whitespace-nowrap">
            {parsing ? 'Getiriliyor…' : 'Bilgileri Getir'}
          </Button>
        </div>
        {parseError && (
          <p className="mt-2 text-sm text-amber-600">{parseError} Manuel doldurabilirsiniz.</p>
        )}
        {parsedData && (
          <p className="mt-2 text-sm text-green-600">
            ✓ Bilgiler getirildi ({parsedData.parse_source === 'gpt4o' ? 'AI yardımıyla' : 'otomatik'}). Kontrol edip düzenleyebilirsiniz.
          </p>
        )}
      </Card>

      {/* Adım 2: Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-800">Adım 2 — Etkinlik Bilgileri</h2>

            {/* Başlık */}
            <Input
              label="Başlık *"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Etkinlik başlığı"
            />

            {/* Açıklama */}
            <div>
              <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <textarea
                id="event-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Etkinlik hakkında kısa bir açıklama (max 500 karakter)"
                maxLength={500}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{description.length}/500</p>
            </div>

            {/* Kategori */}
            <div>
              <label htmlFor="event-category" className="block text-sm font-medium text-gray-700 mb-1">
                Kategori *
              </label>
              <select
                id="event-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                <option value="">Seçin</option>
                {INTEREST_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Online / Yüz yüze */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
                aria-label="Online etkinlik mi"
              />
              <span className="text-sm font-medium text-gray-700">Online etkinlik</span>
            </label>

            {/* Şehir + Mekan (yüz yüze ise) */}
            {!isOnline && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Şehir"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="İstanbul"
                />
                <Input
                  label="Mekan"
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="ATO Congresium"
                />
              </div>
            )}

            {/* Tarihler */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Başlangıç *"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Input
                label="Bitiş"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Kayıt linki */}
            <Input
              label="Kayıt / Bilet Linki"
              type="url"
              value={registrationUrl}
              onChange={(e) => setRegistrationUrl(e.target.value)}
              placeholder="https://kayit.com/etkinlik"
            />

            {/* Etiketler (tags) */}
            <div>
              {/* TagInput custom pattern — kendi içinde input + chip yönetir */}
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className="block text-sm font-medium text-gray-700 mb-1">Etiketler</label>
              <TagInput value={tags} onChange={setTags} max={8} placeholder="react, ai, hackathon…" />
            </div>

            {/* Gönder */}
            {submitResult && !submitResult.success && (
              <p className="text-sm text-red-600">{submitResult.message}</p>
            )}
            <Button
              type="submit"
              size="lg"
              fullWidth
              disabled={submitting || !title || !category || !startDate || !url}
            >
              {submitting ? 'Gönderiliyor…' : 'Etkinliği Gönder'}
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Etkinliğiniz moderatör onayından sonra yayınlanacaktır.
            </p>
          </div>
        </Card>
      </form>
    </div>
  )
}
