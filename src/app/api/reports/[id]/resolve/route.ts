import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const { id: reportId } = await params

  // Sadece moderat?r veya admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.', code: 'UNAUTHORIZED' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['moderator', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Bu i?lem i?in yetkiniz yok.', code: 'FORBIDDEN' }, { status: 403 })
  }

  const { action, event_id } = await request.json()

  if (!['dismiss', 'remove_event'].includes(action)) {
    return NextResponse.json({ error: 'Ge?ersiz aksiyon.', code: 'INVALID_ACTION' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  // Raporu bul
  const { data: report } = await supabaseAdmin
    .from('reports')
    .select('id, status, event_id')
    .eq('id', reportId)
    .single()

  if (!report) {
    return NextResponse.json({ error: 'Rapor bulunamad?.', code: 'NOT_FOUND' }, { status: 404 })
  }

  if (report.status !== 'open') {
    return NextResponse.json({ error: 'Rapor zaten ??z?mlendi.', code: 'ALREADY_RESOLVED' }, { status: 409 })
  }

  // Etkinli?i kald?r (remove_event aksiyonunda)
  if (action === 'remove_event' && event_id) {
    const { error: removeError } = await supabaseAdmin
      .from('events')
      .update({ status: 'removed', removed_at: new Date().toISOString() })
      .eq('id', event_id)

    if (removeError) {
      return NextResponse.json({ error: 'Etkinlik kald?r?lamad?.', code: 'REMOVE_FAILED' }, { status: 500 })
    }

    // Moderasyon logu
    await supabaseAdmin.from('moderation_logs').insert({
      moderator_id: user.id,
      event_id: event_id,
      action: 'removed',
      note: `Rapor ??z?m? sonucu kald?r?ld? (rapor: ${reportId})`,
    })
  }

  // Raporu ??z?mlendi olarak i?aretle
  const { error: resolveError } = await supabaseAdmin
    .from('reports')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq('id', reportId)

  if (resolveError) {
    return NextResponse.json({ error: 'Rapor g?ncellenemedi.', code: 'UPDATE_FAILED' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
