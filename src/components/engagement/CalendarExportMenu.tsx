'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  eventId: string
  /** Etkinlik slug'ı — endpoint UUID veya slug kabul ediyor; slug daha kısa URL. */
  eventSlug: string
}

/**
 * CalendarExportMenu — etkinliği takvime ekleme dropdown'ı.
 *
 * Seçenekler:
 * - iCal indir (.ics) → Apple Calendar, Outlook, Thunderbird, Fastmail vb.
 * - Google Calendar → calendar.google.com'a redirect, ön-doldurulmuş form
 * - Outlook Web → iCal indirip Outlook'a aktarma (aynı .ics endpoint'i)
 */
export function CalendarExportMenu({ eventId: _eventId, eventSlug }: Props) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const icalUrl = `/api/events/${eventSlug}/ical`
  const googleUrl = `/api/events/${eventSlug}/google-calendar`

  return (
    <div className="relative inline-flex" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all"
      >
        <CalendarIcon />
        <span>Takvime ekle</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20"
        >
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <GoogleIcon />
            <div className="flex-1">
              <div className="font-medium">Google Calendar</div>
              <div className="text-xs text-gray-500">Ön-doldurulmuş form açılır</div>
            </div>
          </a>
          <a
            href={icalUrl}
            download
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            <AppleIcon />
            <div className="flex-1">
              <div className="font-medium">Apple Calendar</div>
              <div className="text-xs text-gray-500">.ics dosyası indir</div>
            </div>
          </a>
          <a
            href={icalUrl}
            download
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            <OutlookIcon />
            <div className="flex-1">
              <div className="font-medium">Outlook / Thunderbird</div>
              <div className="text-xs text-gray-500">.ics dosyası indir</div>
            </div>
          </a>
        </div>
      )}
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-base">
      📅
    </span>
  )
}

function AppleIcon() {
  return (
    <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 text-base">
      🍎
    </span>
  )
}

function OutlookIcon() {
  return (
    <span className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 text-base">
      📧
    </span>
  )
}
