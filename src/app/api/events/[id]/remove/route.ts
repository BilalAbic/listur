import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const { id: eventId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.', code: 'UNAUTHORIZED' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['moderator', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Yetersiz yetki.', code: 'FORBIDDEN' }, { status: 403 })
  }

  const { note } = await request.json().catch(() => ({ note: '' }))
  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from('events')
    .update({ status: 'removed', removed_at: new Date().toISOString() })
    .eq('id', eventId)

  if (error) return NextResponse.json({ error: 'Güncelleme başarısız.', code: 'UPDATE_FAILED' }, { status: 500 })

  await supabaseAdmin.from('moderation_logs').insert({
    moderator_id: user.id,
    event_id: eventId,
    action: 'removed',
    note: note ?? null,
  })

  return NextResponse.json({ success: true, message: 'Etkinlik kaldırıldı.' })
}
