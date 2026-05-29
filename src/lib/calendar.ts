/**
 * Takvim export yardımcıları — iCal (RFC 5545) ve Google Calendar.
 *
 * Kullanım:
 *   buildIcs(event, baseUrl)         → .ics dosya içeriği (UTF-8, CRLF satır sonu)
 *   buildGoogleCalendarUrl(event, baseUrl) → Google Calendar "Quick add" URL
 */

import { getBaseUrl } from '@/lib/site'

export interface CalendarEvent {
  id?: string
  slug: string
  title: string
  description?: string | null
  start_date: string
  end_date?: string | null
  city?: string | null
  venue_name?: string | null
  is_online?: boolean | null
}

/**
 * RFC 5545 uyumlu .ics dosyası üretir.
 * - UTC timestamp formatı (Z suffix) — universal.
 * - DESCRIPTION/SUMMARY/LOCATION'da virgül/noktalı virgül/ters slash/satır sonu escape edilir.
 * - Line folding (75 octet limit) basit haliyle uygulanır.
 */
export function buildIcs(event: CalendarEvent, baseUrlOverride?: string): string {
  const baseUrl = baseUrlOverride ?? getBaseUrl()
  const url = `${baseUrl}/etkinlik/${event.slug}`
  const uid = `${event.slug}@listur.dev`
  const now = formatIcsTimestamp(new Date().toISOString())
  const dtStart = formatIcsTimestamp(event.start_date)
  const dtEnd = formatIcsTimestamp(event.end_date ?? defaultEndDate(event.start_date))
  const summary = escapeIcsText(event.title)
  const description = escapeIcsText(buildDescription(event, url))
  const location = escapeIcsText(formatLocation(event))

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Listur//Etkinlik//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `URL:${url}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  // CRLF satır sonu + her satırı 75 octet'te fold et (RFC 5545)
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

/**
 * Google Calendar "Quick add" URL'i üretir.
 * Kullanıcı bu URL'e gittiğinde Google Calendar yeni etkinlik oluşturma formunu
 * ön-doldurulmuş şekilde gösterir.
 *
 * Format ref: https://developers.google.com/calendar/api/guides/create-events
 */
export function buildGoogleCalendarUrl(
  event: CalendarEvent,
  baseUrlOverride?: string
): string {
  const baseUrl = baseUrlOverride ?? getBaseUrl()
  const url = `${baseUrl}/etkinlik/${event.slug}`
  const start = formatIcsTimestamp(event.start_date)
  const end = formatIcsTimestamp(event.end_date ?? defaultEndDate(event.start_date))

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: buildDescription(event, url),
    location: formatLocation(event),
    trp: 'false',
    sf: 'true',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * ISO 8601 timestamp'i RFC 5545 UTC formatına çevirir: YYYYMMDDTHHMMSSZ
 */
function formatIcsTimestamp(isoString: string): string {
  const d = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

/**
 * end_date yoksa varsayılan: start + 2 saat
 */
function defaultEndDate(startIso: string): string {
  const d = new Date(startIso)
  d.setHours(d.getHours() + 2)
  return d.toISOString()
}

/**
 * RFC 5545 TEXT escape:
 * - Ters slash → \\
 * - Noktalı virgül → \;
 * - Virgül → \,
 * - Satır sonu (LF, CR, CRLF) → \n
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

/**
 * RFC 5545 Line folding: 75 octet (yaklaşık 75 karakter) sonrası
 * CRLF + tek boşluk ile devam.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  let i = 0
  // İlk satır 75, sonraki satırlar 74 (1 boşluk prefix'i hesaba kat)
  chunks.push(line.slice(0, 75))
  i = 75
  while (i < line.length) {
    chunks.push(line.slice(i, i + 74))
    i += 74
  }
  return chunks.join('\r\n ')
}

function buildDescription(event: CalendarEvent, eventUrl: string): string {
  const parts: string[] = []
  if (event.description) parts.push(event.description.trim())
  parts.push(`Detaylar: ${eventUrl}`)
  return parts.join('\n\n')
}

function formatLocation(event: CalendarEvent): string {
  if (event.is_online) return 'Online'
  const parts: string[] = []
  if (event.venue_name) parts.push(event.venue_name)
  if (event.city) parts.push(event.city)
  return parts.join(', ') || 'Belirtilmemiş'
}
