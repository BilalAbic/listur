import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationPageList } from '@/components/notifications/NotificationPageList'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Bildirimler — Listur' }

export default async function BildirimlerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris?redirect=/bildirimler')

  const { data: notifications } = await supabase
    .from('notifications')
    .select(`
      *,
      events!event_id(id, title, slug, cover_image)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Bildirimler</h1>
        {(notifications?.some((n) => !n.read_at)) && (
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
            {notifications?.filter((n) => !n.read_at).length} okunmamış
          </span>
        )}
      </div>
      <NotificationPageList notifications={notifications ?? []} userId={user.id} />
    </div>
  )
}
