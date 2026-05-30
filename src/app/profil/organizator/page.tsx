import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Organizatör Dashboard',
}

export const dynamic = 'force-dynamic'

interface EventRow {
  id: string
  title: string
  slug: string
  status: string
  start_date: string
  view_count: number
  favorite_count: number
  rsvp_count: number
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const statusLabels: Record<string, { label: string; cls: string }> = {
  published: { label: 'Yayında', cls: 'bg-green-100 text-green-700' },
  pending: { label: 'Beklemede', cls: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: 'Reddedildi', cls: 'bg-red-100 text-red-700' },
  removed: { label: 'Kaldırıldı', cls: 'bg-gray-100 text-gray-600' },
}

export default async function OrganizerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/giris?redirect=/profil/organizator')
  }

  const supabaseAdmin = createAdminClient()

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, name, handle, is_organizer, verified_at, follower_count')
    .eq('id', user.id)
    .single()

  // Doğrulanmış organizatör değilse — başvuru ekranına yönlendir
  if (!profile?.is_organizer || !profile.handle) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="text-5xl mb-3">📋</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Henüz doğrulanmış organizatör değilsin</h1>
          <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
            Doğrulanmış organizatör olunca <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">/organizator/handle</code>{' '}
            adresinde public profil sayfan ve etkinlik analytics'in olur.
          </p>
          <Link
            href="/profil/organizator-basvuru"
            className="inline-flex px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
          >
            Başvuru yap →
          </Link>
        </div>
      </div>
    )
  }

  // Etkinlikleri çek
  const { data: events } = await supabaseAdmin
    .from('events')
    .select('id, title, slug, status, start_date, view_count, favorite_count, rsvp_count')
    .eq('organizer_id', profile.id)
    .order('start_date', { ascending: false })

  const rows = (events ?? []) as EventRow[]
  const totals = rows.reduce(
    (acc, e) => {
      acc.view_count += e.view_count
      acc.favorite_count += e.favorite_count
      acc.rsvp_count += e.rsvp_count
      return acc
    },
    { view_count: 0, favorite_count: 0, rsvp_count: 0 }
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Başlık */}
      <header className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Organizatör Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            @{profile.handle} · {rows.length} etkinlik
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/organizator/${profile.handle}`}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Public profilim →
          </Link>
          <Link
            href="/etkinlik-gonder"
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            + Etkinlik Ekle
          </Link>
        </div>
      </header>

      {/* Toplam sayaçlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Takipçi" value={profile.follower_count} accent="indigo" />
        <StatCard label="Görüntülenme" value={totals.view_count} accent="blue" />
        <StatCard label="Favori" value={totals.favorite_count} accent="red" />
        <StatCard label="RSVP" value={totals.rsvp_count} accent="amber" />
      </div>

      {/* Etkinlik tablosu */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Etkinliklerim</h2>
        {rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">
            Henüz etkinlik göndermedin.{' '}
            <Link href="/etkinlik-gonder" className="text-indigo-600 underline">
              İlk etkinliğini ekle
            </Link>
            .
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Etkinlik</th>
                  <th className="px-5 py-3">Tarih</th>
                  <th className="px-5 py-3">Durum</th>
                  <th className="px-5 py-3 text-right">👁</th>
                  <th className="px-5 py-3 text-right">❤</th>
                  <th className="px-5 py-3 text-right">🎯 RSVP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((e) => {
                  const st = statusLabels[e.status] ?? { label: e.status, cls: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={e.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 max-w-xs">
                        <Link
                          href={`/etkinlik/${e.slug}`}
                          className="font-medium text-gray-900 hover:text-indigo-600 truncate block"
                        >
                          {e.title}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(e.start_date)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{e.view_count}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{e.favorite_count}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{e.rsvp_count}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  accent: 'indigo' | 'blue' | 'red' | 'amber'
}

function StatCard({ label, value, accent }: StatCardProps) {
  const accentClasses = {
    indigo: 'text-indigo-600',
    blue: 'text-blue-600',
    red: 'text-red-500',
    amber: 'text-amber-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-extrabold ${accentClasses[accent]}`}>{value.toLocaleString('tr-TR')}</p>
    </div>
  )
}
