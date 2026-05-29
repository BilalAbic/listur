import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Etkinlik Takvimi',
  description: 'Türkiye teknoloji etkinliklerini ay görünümünde keşfedin.',
}

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ month?: string }>

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

const WEEKDAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

interface CalendarEvent {
  id: string
  title: string
  slug: string
  category: string
  start_date: string
  city: string | null
  is_online: boolean
}

/**
 * `month` query param'ı YYYY-MM formatında parse eder; geçersizse mevcut ay.
 */
function parseMonth(monthParam: string | undefined): { year: number; month: number } {
  const now = new Date()
  if (!monthParam) return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 }

  const match = /^(\d{4})-(\d{1,2})$/.exec(monthParam)
  if (!match) return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 }

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  if (year < 2020 || year > 2099 || month < 1 || month > 12) {
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 }
  }
  return { year, month }
}

/**
 * Belirli ay için tüm günleri (önceki/sonraki ay padding'iyle) hesaplar.
 * Hafta Pazartesi başlar.
 */
function buildMonthGrid(year: number, month: number) {
  // Ayın ilk günü (1) ve son günü
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1))
  const lastOfMonth = new Date(Date.UTC(year, month, 0))

  // İlk gün haftanın hangi günü? (0=Paz, 1=Pzt, ..., 6=Cmt)
  // Pazartesi başlangıç: Paz=6, Pzt=0, Sal=1, ..., Cmt=5
  const firstWeekday = firstOfMonth.getUTCDay()
  const leadingDays = (firstWeekday === 0 ? 6 : firstWeekday - 1)

  // Grid başlangıcı (önceki aydan padding)
  const gridStart = new Date(firstOfMonth)
  gridStart.setUTCDate(gridStart.getUTCDate() - leadingDays)

  // Toplam 42 hücre (6 hafta) — bazı aylar 35 yeter ama 42 her zaman güvenli
  const days: Array<{ date: Date; inMonth: boolean }> = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart)
    date.setUTCDate(date.getUTCDate() + i)
    days.push({ date, inMonth: date.getUTCMonth() + 1 === month })
  }

  return { firstOfMonth, lastOfMonth, days }
}

function buildMonthLink(year: number, month: number, delta: number): string {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1))
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + 1
  return `/takvim?month=${y}-${String(m).padStart(2, '0')}`
}

const categoryColors: Record<string, string> = {
  'Yapay Zeka / ML': 'bg-purple-100 text-purple-700 border-purple-200',
  'Blockchain / Web3': 'bg-orange-100 text-orange-700 border-orange-200',
  'Mobil Geliştirme': 'bg-blue-100 text-blue-700 border-blue-200',
  'Backend / DevOps': 'bg-green-100 text-green-700 border-green-200',
  'Siber Güvenlik': 'bg-red-100 text-red-700 border-red-200',
  'Girişimcilik / Startup': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Tasarım / UX': 'bg-pink-100 text-pink-700 border-pink-200',
  'Oyun Geliştirme': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Veri Bilimi': 'bg-teal-100 text-teal-700 border-teal-200',
  'Açık Kaynak': 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

export default async function TakvimSayfasi({ searchParams }: { searchParams: SearchParams }) {
  const { month: monthParam } = await searchParams
  const { year, month } = parseMonth(monthParam)
  const { firstOfMonth, lastOfMonth, days } = buildMonthGrid(year, month)

  // Ay aralığındaki etkinlikleri çek (önceki/sonraki ay padding hücreleri için biraz geniş aralık)
  const queryStart = new Date(days[0].date)
  const queryEnd = new Date(days[days.length - 1].date)
  queryEnd.setUTCDate(queryEnd.getUTCDate() + 1)

  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select('id, title, slug, category, start_date, city, is_online')
    .eq('status', 'published')
    .gte('start_date', queryStart.toISOString())
    .lt('start_date', queryEnd.toISOString())
    .order('start_date', { ascending: true })

  // Tarih bazlı grupla (YYYY-MM-DD anahtarı)
  const eventsByDate = new Map<string, CalendarEvent[]>()
  for (const ev of (events ?? []) as CalendarEvent[]) {
    const key = ev.start_date.slice(0, 10)
    const list = eventsByDate.get(key) ?? []
    list.push(ev)
    eventsByDate.set(key, list)
  }

  const todayKey = new Date().toISOString().slice(0, 10)
  const monthLabel = `${MONTH_NAMES_TR[month - 1]} ${year}`
  const prevHref = buildMonthLink(year, month, -1)
  const nextHref = buildMonthLink(year, month, 1)
  const currentHref = buildMonthLink(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth() + 1,
    0
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Başlık + navigasyon */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{monthLabel}</h1>
          <p className="text-sm text-gray-500">
            {(events ?? []).length} etkinlik · Türkiye teknoloji topluluğu
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={prevHref}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Önceki ay"
          >
            ‹ Önceki
          </Link>
          <Link
            href={currentHref}
            className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Bugün
          </Link>
          <Link
            href={nextHref}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Sonraki ay"
          >
            Sonraki ›
          </Link>
        </div>
      </div>

      {/* Hafta günleri başlığı */}
      <div className="grid grid-cols-7 gap-px mb-px bg-gray-200 rounded-t-2xl overflow-hidden">
        {WEEKDAYS_TR.map((wd) => (
          <div
            key={wd}
            className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 text-center"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Ay grid'i */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-b-2xl overflow-hidden border border-gray-200">
        {days.map(({ date, inMonth }, i) => {
          const dateKey = date.toISOString().slice(0, 10)
          const dayEvents = eventsByDate.get(dateKey) ?? []
          const isToday = dateKey === todayKey

          return (
            <div
              key={i}
              className={`bg-white min-h-[110px] p-2 flex flex-col gap-1 ${
                inMonth ? '' : 'bg-gray-50/50'
              }`}
            >
              <div
                className={`text-xs font-semibold ${
                  isToday
                    ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white'
                    : inMonth
                    ? 'text-gray-700'
                    : 'text-gray-300'
                }`}
              >
                {date.getUTCDate()}
              </div>

              {/* En fazla 3 etkinlik, fazlası "+N daha" */}
              {dayEvents.slice(0, 3).map((ev) => {
                const color = categoryColors[ev.category] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                return (
                  <Link
                    key={ev.id}
                    href={`/etkinlik/${ev.slug}`}
                    className={`block truncate text-xs px-1.5 py-0.5 rounded border ${color} hover:opacity-80 transition-opacity`}
                    title={ev.title}
                  >
                    {ev.title}
                  </Link>
                )
              })}
              {dayEvents.length > 3 && (
                <span className="text-xs text-gray-500 px-1">
                  +{dayEvents.length - 3} daha
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Boş durum */}
      {(events ?? []).length === 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Bu ayda henüz yayında etkinlik yok. <Link href="/etkinlik-gonder" className="text-indigo-600 underline">Etkinlik ekle</Link>.
        </div>
      )}

      {/* Hidden — accessibility için lastOfMonth + firstOfMonth (anlamsız warning'i sustur) */}
      <span className="sr-only" aria-hidden>
        {firstOfMonth.toISOString()} - {lastOfMonth.toISOString()}
      </span>
    </div>
  )
}
