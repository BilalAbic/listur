import { type NextRequest, NextResponse } from 'next/server'
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

  const { rejection_note } = await request.json().catch(() => ({ rejection_note: '' }))

  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from('events')
    .update({ status: 'rejected', rejection_note: rejection_note ?? null })
    .eq('id', eventId)
    .eq('status', 'pending')

  if (error) return NextResponse.json({ error: 'Güncelleme başarısız.', code: 'UPDATE_FAILED' }, { status: 500 })

  await supabaseAdmin.from('moderation_logs').insert({
    moderator_id: user.id,
    event_id: eventId,
    action: 'rejected',
    note: rejection_note ?? null,
  })

  // Gönderici bildirim
  const { data: submission } = await supabaseAdmin
    .from('submissions')
    .select('submitted_by')
    .eq('event_id', eventId)
    .order('submitted_at', { ascending: true })
    .limit(1)
    .single()

  if (submission) {
    await supabaseAdmin.from('notifications').insert({
      user_id: submission.submitted_by,
      event_id: eventId,
      type: 'submission_rejected',
    })
  }

  return NextResponse.json({ success: true, message: 'Etkinlik reddedildi.' })
}
