import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PendingEventsList } from '@/components/moderation/PendingEventsList'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Bekleyenler ? Moderat?r' }

export default async function BekleyenlerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const supabaseAdmin = createAdminClient()
  const { data: events } = await supabaseAdmin
    .from('events')
    .select('*, profiles!organizer_id(name, email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Onay Bekleyen Etkinlikler</h2>
        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded-full">
          {events?.length ?? 0} bekliyor
        </span>
      </div>
      <PendingEventsList events={events ?? []} />
    </div>
  )
}
