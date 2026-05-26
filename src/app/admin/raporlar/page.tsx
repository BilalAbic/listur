import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ReportsList } from '@/components/moderation/ReportsList'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Raporlar ? Admin' }

export default async function AdminRaporlarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const supabaseAdmin = createAdminClient()
  const { data: reports } = await supabaseAdmin
    .from('reports')
    .select(`
      *,
      events!event_id(id, title, slug, status)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: true })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">A??k Raporlar</h2>
        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
          {reports?.length ?? 0} rapor
        </span>
      </div>
      <ReportsList reports={reports ?? []} moderatorId={user.id} />
    </div>
  )
}
