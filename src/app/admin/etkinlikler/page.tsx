import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AllEventsList } from '@/components/moderation/AllEventsList'
import type { Metadata } from 'next'
import type { Database } from '@/types/database'

type EventStatus = Database['public']['Enums']['event_status']

export const metadata: Metadata = { title: 'Etkinlikler ? Admin' }

export default async function AdminEtkinliklerPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { status = 'published', page = '1' } = await searchParams
  const pageNum = Math.max(1, parseInt(page))
  const pageSize = 20
  const from = (pageNum - 1) * pageSize

  const supabaseAdmin = createAdminClient()
  const query = supabaseAdmin
    .from('events')
    .select('id, title, category, city, status, start_date, created_at, slug, organizer_id, profiles!organizer_id(name)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  const VALID_STATUSES: EventStatus[] = ['pending', 'published', 'rejected', 'removed']
  if (status !== 'all' && VALID_STATUSES.includes(status as EventStatus)) {
    query.eq('status', status as EventStatus)
  }

  const { data: events, count } = await query

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">T?m Etkinlikler</h2>
        <span className="text-sm text-gray-500">{count ?? 0} toplam</span>
      </div>
      <AllEventsList
        events={events ?? []}
        currentStatus={status}
        currentPage={pageNum}
        totalPages={totalPages}
      />
    </div>
  )
}
