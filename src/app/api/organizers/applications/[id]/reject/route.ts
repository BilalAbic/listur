import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

interface RejectBody {
  rejection_note?: unknown
}

/**
 * PATCH /api/organizers/applications/[id]/reject
 *
 * Admin yetkili. Başvuruyu reddeder:
 *  - application.status = 'resolved', rejection_note, reviewed_by, reviewed_at
 *  - notifications insert (submission_rejected re-use; event_id NULL → UI
 *    "Doğrulama başvurun reddedildi" şeklinde gösterir)
 *
 * Reject sonrası yeniden başvuru sınırsız (cool-down ileride eklenir).
 */
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const { id: applicationId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { data: actor } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!actor || actor.role !== 'admin') {
    return NextResponse.json({ error: 'Yetersiz yetki.', code: 'FORBIDDEN' }, { status: 403 })
  }

  let body: RejectBody = {}
  try {
    body = await request.json()
  } catch {
    // opsiyonel gövde
  }

  const note = typeof body.rejection_note === 'string' ? body.rejection_note.trim() : ''
  if (note.length > 500) {
    return NextResponse.json(
      { error: 'Not en fazla 500 karakter olabilir.', code: 'NOTE_TOO_LONG' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createAdminClient()

  const { data: application } = await supabaseAdmin
    .from('organizer_applications')
    .select('id, user_id, status')
    .eq('id', applicationId)
    .single()

  if (!application) {
    return NextResponse.json({ error: 'Başvuru bulunamadı.', code: 'NOT_FOUND' }, { status: 404 })
  }
  if (application.status !== 'open') {
    return NextResponse.json(
      { error: 'Bu başvuru zaten işlenmiş.', code: 'ALREADY_PROCESSED' },
      { status: 409 }
    )
  }

  const now = new Date().toISOString()

  const { error: appErr } = await supabaseAdmin
    .from('organizer_applications')
    .update({
      status: 'resolved',
      reviewed_by: user.id,
      reviewed_at: now,
      rejection_note: note || null,
    })
    .eq('id', applicationId)

  if (appErr) {
    return NextResponse.json(
      { error: 'Başvuru güncellenemedi.', code: 'UPDATE_FAILED' },
      { status: 500 }
    )
  }

  // Bildirim — submission_rejected re-use (event_id NULL ile organizer app reject ayırt edilir)
  await supabaseAdmin.from('notifications').insert({
    user_id: application.user_id,
    type: 'submission_rejected',
  })

  return NextResponse.json({ success: true })
}
