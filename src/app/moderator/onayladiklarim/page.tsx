import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ApprovedEventsList } from '@/components/moderation/ApprovedEventsList'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Onayladıklarım — Moderatör' }

export default async function OnayladiklarimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const supabaseAdmin = createAdminClient()

  // Bu moderatörün onayladığı etkinlikleri moderation_logs üzerinden getir
  const { data: logs } = await supabaseAdmin
    .from('moderation_logs')
    .select('event_id, created_at, note')
    .eq('moderator_id', user.id)
    .eq('action', 'approved')
    .order('created_at', { ascending: false })

  const eventIds = (logs ?? []).map((l) => l.event_id).filter(Boolean) as string[]

  let events: Array<{
    id: string
    title: string
    category: string
    start_date: string
    city: string | null
    status: string
    published_at: string | null
    slug: string
  }> = []

  if (eventIds.length > 0) {
    const { data } = await supabaseAdmin
      .from('events')
      .select('id, title, category, start_date, city, status, published_at, slug')
      .in('id', eventIds)
    events = data ?? []
  }

  // Log tarihlerini etkinlik ID'sine göre map et
  const logMap = Object.fromEntries(
    (logs ?? []).map((l) => [l.event_id, l.created_at])
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Onayladıklarım</h2>
        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
          {events.length} etkinlik
        </span>
      </div>
      <ApprovedEventsList events={events} logMap={logMap} />
    </div>
  )
}
