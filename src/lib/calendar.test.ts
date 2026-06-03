import { describe, expect, it } from 'vitest'
import { buildIcs, buildGoogleCalendarUrl, type CalendarEvent } from './calendar'

const SAMPLE_EVENT: CalendarEvent = {
  slug: 'istanbul-ai-hackathon',
  title: 'İstanbul AI Hackathon',
  description: 'En büyük yapay zeka maratonu.',
  start_date: '2026-06-15T10:00:00.000Z',
  end_date: '2026-06-15T18:00:00.000Z',
  city: 'İstanbul',
  venue_name: 'Bilgi Üniversitesi',
  is_online: false,
}

const BASE_URL = 'https://listur.bilalabic.com'

describe('buildIcs', () => {
  it('RFC 5545 zorunlu header satırlarını içerir', () => {
    const ics = buildIcs(SAMPLE_EVENT, BASE_URL)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('VERSION:2.0')
    expect(ics).toContain('PRODID:-//Listur//Etkinlik//TR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('END:VEVENT')
    expect(ics).toContain('END:VCALENDAR')
  })

  it('UID formatı slug@domain', () => {
    const ics = buildIcs(SAMPLE_EVENT, BASE_URL)
    expect(ics).toContain('UID:istanbul-ai-hackathon@listur.bilalabic.com')
  })

  it('DTSTART/DTEND UTC formatında (YYYYMMDDTHHMMSSZ)', () => {
    const ics = buildIcs(SAMPLE_EVENT, BASE_URL)
    expect(ics).toMatch(/DTSTART:20260615T100000Z/)
    expect(ics).toMatch(/DTEND:20260615T180000Z/)
  })

  it('end_date yoksa start + 2 saat', () => {
    const ics = buildIcs({ ...SAMPLE_EVENT, end_date: null }, BASE_URL)
    expect(ics).toContain('DTSTART:20260615T100000Z')
    expect(ics).toContain('DTEND:20260615T120000Z')
  })

  it('LOCATION online ise "Online"', () => {
    const ics = buildIcs({ ...SAMPLE_EVENT, is_online: true }, BASE_URL)
    expect(ics).toContain('LOCATION:Online')
  })

  it('LOCATION yüz yüze ise venue + city', () => {
    const ics = buildIcs(SAMPLE_EVENT, BASE_URL)
    expect(ics).toContain('LOCATION:Bilgi Üniversitesi\\, İstanbul')
  })

  it('TEXT escape: virgül \\,, noktalı virgül \\; ve satır sonu \\n', () => {
    const ics = buildIcs(
      { ...SAMPLE_EVENT, description: 'Satır 1\nSatır 2; kontrolsüz, içerik' },
      BASE_URL
    )
    expect(ics).toContain('Satır 1\\nSatır 2\\; kontrolsüz\\, içerik')
  })

  it('URL etkinliğin canonical link\'ini içerir', () => {
    const ics = buildIcs(SAMPLE_EVENT, BASE_URL)
    expect(ics).toContain(`URL:${BASE_URL}/etkinlik/${SAMPLE_EVENT.slug}`)
  })

  it('satırları CRLF ile bitirir', () => {
    const ics = buildIcs(SAMPLE_EVENT, BASE_URL)
    expect(ics.endsWith('\r\n')).toBe(true)
    expect(ics.split('\r\n').length).toBeGreaterThan(10)
  })
})

describe('buildGoogleCalendarUrl', () => {
  it('Google Calendar render endpoint\'ine yönlendirir', () => {
    const url = buildGoogleCalendarUrl(SAMPLE_EVENT, BASE_URL)
    expect(url.startsWith('https://calendar.google.com/calendar/render?')).toBe(true)
  })

  it('action=TEMPLATE parametresi içerir', () => {
    const url = buildGoogleCalendarUrl(SAMPLE_EVENT, BASE_URL)
    const u = new URL(url)
    expect(u.searchParams.get('action')).toBe('TEMPLATE')
  })

  it('dates parametresi start/end UTC formatında', () => {
    const url = buildGoogleCalendarUrl(SAMPLE_EVENT, BASE_URL)
    const u = new URL(url)
    expect(u.searchParams.get('dates')).toBe('20260615T100000Z/20260615T180000Z')
  })

  it('text parametresi başlığı içerir', () => {
    const url = buildGoogleCalendarUrl(SAMPLE_EVENT, BASE_URL)
    const u = new URL(url)
    expect(u.searchParams.get('text')).toBe('İstanbul AI Hackathon')
  })

  it('location online ise "Online"', () => {
    const url = buildGoogleCalendarUrl({ ...SAMPLE_EVENT, is_online: true }, BASE_URL)
    const u = new URL(url)
    expect(u.searchParams.get('location')).toBe('Online')
  })
})
