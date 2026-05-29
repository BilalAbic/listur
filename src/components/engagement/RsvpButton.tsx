'use client'

import { useState, useRef, useEffect } from 'react'
import { useRsvps, type RsvpStatus } from '@/hooks/useRsvps'

interface Props {
  eventId: string
  redirectTo?: string
  /** Toplam RSVP sayısı (going + interested) — sosyal kanıt için. */
  count?: number
}

interface Option {
  status: RsvpStatus
  label: string
  emoji: string
  classes: string
}

const OPTIONS: Option[] = [
  { status: 'going', label: 'Katılıyorum', emoji: '🎯', classes: 'bg-indigo-600 text-white hover:bg-indigo-700' },
  { status: 'interested', label: 'İlgileniyorum', emoji: '✨', classes: 'bg-amber-500 text-white hover:bg-amber-600' },
  { status: 'not_going', label: 'Katılamıyorum', emoji: '✖', classes: 'bg-gray-500 text-white hover:bg-gray-600' },
]

/**
 * RsvpButton — etkinlik için RSVP durumunu kaydeder/değiştirir/siler.
 *
 * Default: "Katılıyorum / İlgileniyorum" ana butonlar + dropdown ile diğer seçenekler.
 * Kullanıcı durum seçince buton seçili stile geçer; tekrar tıklayınca temizler.
 */
export function RsvpButton({ eventId, redirectTo, count }: Props) {
  const { getStatus, setRsvp, clearRsvp } = useRsvps()
  const status = getStatus(eventId)
  const [busy, setBusy] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Dış tıklama ile menüyü kapat
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleSelect = async (s: RsvpStatus) => {
    if (busy) return
    setBusy(true)
    setMenuOpen(false)
    if (status === s) {
      await clearRsvp(eventId)
    } else {
      await setRsvp(eventId, s, redirectTo)
    }
    setBusy(false)
  }

  const current = OPTIONS.find((o) => o.status === status)
  const buttonLabel = current ? `${current.emoji} ${current.label}` : 'RSVP'
  const buttonClasses = current
    ? current.classes
    : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'

  return (
    <div className="relative inline-flex" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${buttonClasses} disabled:opacity-60`}
      >
        <span>{buttonLabel}</span>
        {typeof count === 'number' && count > 0 && (
          <span className="text-xs opacity-80 font-normal">({count})</span>
        )}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {menuOpen && (
        <div
          role="menu"
          className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20"
        >
          {OPTIONS.map((opt) => {
            const isCurrent = status === opt.status
            return (
              <button
                key={opt.status}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(opt.status)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  isCurrent ? 'bg-indigo-50/60 font-semibold text-indigo-700' : 'text-gray-700'
                }`}
              >
                <span>
                  <span className="mr-2">{opt.emoji}</span>
                  {opt.label}
                </span>
                {isCurrent && (
                  <span className="text-xs text-indigo-600">Seçili — tekrar tıkla, kaldır</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
