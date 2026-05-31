'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Initial {
  requested_handle?: string
  bio?: string
  website?: string
  twitter?: string
  github?: string
  reason?: string
}

interface Props {
  initial?: Initial
}

export function ApplicationForm({ initial }: Props) {
  const router = useRouter()
  const [handle, setHandle] = useState(initial?.requested_handle ?? '')
  const [bio, setBio] = useState(initial?.bio ?? '')
  const [website, setWebsite] = useState(initial?.website ?? '')
  const [twitter, setTwitter] = useState(initial?.twitter ?? '')
  const [github, setGithub] = useState(initial?.github ?? '')
  const [reason, setReason] = useState(initial?.reason ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage(null)

    try {
      const res = await fetch('/api/organizers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requested_handle: handle,
          bio,
          website,
          twitter,
          github,
          reason,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Başvuru kaydedilemedi.' })
        setBusy(false)
        return
      }
      setMessage({
        type: 'success',
        text: 'Başvurun alındı! Admin inceledikten sonra bildirim alacaksın.',
      })
      setBusy(false)
      // Sayfa durum kartını yenile
      router.refresh()
    } catch {
      setMessage({ type: 'error', text: 'Beklenmedik bir hata oluştu.' })
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Handle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Handle <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500 overflow-hidden">
          <span className="bg-gray-50 px-3 py-2.5 text-sm text-gray-500 border-r border-gray-200">@</span>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
            required
            minLength={3}
            maxLength={30}
            placeholder="acme-tech"
            className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          3-30 karakter; sadece harf, rakam, _ ve - kullanabilirsin. Onaylandıktan sonra değiştirilemez.
        </p>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="Topluluğunu ve etkinlik temalarını kısaca anlat."
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-y"
        />
        <p className="text-xs text-gray-500 mt-1">{bio.length}/300</p>
      </div>

      {/* Website + Twitter + GitHub */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Website"
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="acme.com"
        />
        <Input
          label="Twitter / X"
          type="text"
          value={twitter}
          onChange={(e) => setTwitter(e.target.value)}
          placeholder="@acme"
        />
        <Input
          label="GitHub"
          type="text"
          value={github}
          onChange={(e) => setGithub(e.target.value)}
          placeholder="acme-tech"
        />
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Neden başvuruyorsun?</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="Düzenlediğin etkinliklerden örnekler ver, topluluğunu tanıt."
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-y"
        />
        <p className="text-xs text-gray-500 mt-1">{reason.length}/300</p>
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? 'Gönderiliyor…' : 'Başvuruyu Gönder'}
        </Button>
      </div>
    </form>
  )
}
