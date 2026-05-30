import { createAdminClient } from '@/lib/supabase/server'
import { ApplicationsList } from '@/components/organizers/ApplicationsList'

export const dynamic = 'force-dynamic'

interface RawApp {
  id: string
  user_id: string
  requested_handle: string
  bio: string | null
  website: string | null
  twitter: string | null
  github: string | null
  reason: string | null
  status: string
  created_at: string
  reviewed_at: string | null
  rejection_note: string | null
  applicant: { name: string; email: string } | { name: string; email: string }[] | null
}

function normalize(rows: RawApp[]) {
  return rows.map((r) => ({
    ...r,
    applicant: Array.isArray(r.applicant) ? r.applicant[0] ?? null : r.applicant,
  }))
}

export default async function OrganizatorBasvurulariSayfa() {
  // Admin guard /admin/layout.tsx içinde
  const supabaseAdmin = createAdminClient()

  const { data: openApps } = await supabaseAdmin
    .from('organizer_applications')
    .select(
      'id, user_id, requested_handle, bio, website, twitter, github, reason, status, created_at, reviewed_at, rejection_note, applicant:profiles!organizer_applications_user_id_fkey(name, email)'
    )
    .eq('status', 'open')
    .order('created_at', { ascending: true })

  const { data: resolvedApps } = await supabaseAdmin
    .from('organizer_applications')
    .select(
      'id, user_id, requested_handle, bio, website, twitter, github, reason, status, created_at, reviewed_at, rejection_note, applicant:profiles!organizer_applications_user_id_fkey(name, email)'
    )
    .eq('status', 'resolved')
    .order('reviewed_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          Açık Başvurular
          <span className="text-sm font-normal text-gray-500">({openApps?.length ?? 0})</span>
        </h2>
        <ApplicationsList
          applications={normalize((openApps ?? []) as RawApp[])}
          actionable
        />
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          Geçmiş
          <span className="text-sm font-normal text-gray-500">(son 20)</span>
        </h2>
        <ApplicationsList
          applications={normalize((resolvedApps ?? []) as RawApp[])}
          actionable={false}
        />
      </section>
    </div>
  )
}
