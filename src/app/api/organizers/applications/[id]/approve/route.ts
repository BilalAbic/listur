import { type NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

/**
 * PATCH /api/organizers/applications/[id]/approve
 *
 * Admin yetkili. Başvuruyu onaylar:
 *  - application.status = 'resolved', reviewed_by, reviewed_at
 *  - profiles update: handle, bio, website, twitter, github, is_organizer=true, verified_at
 *  - notifications insert (organizer_verified)
 *
 * NOT: moderation_logs tablosu event_id NOT NULL olduğu için organizer
 * doğrulama burada log'lanmıyor. Audit organizer_applications üzerinden
 * (reviewed_by + reviewed_at + status) sağlanıyor.
 */
export async function PATCH(_request: NextRequest, { params }: { params: Params }) {
  const { id: applicationId } = await params

  // Auth + admin role
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

  const supabaseAdmin = createAdminClient()

  // Application'ı bul (open olmalı)
  const { data: application } = await supabaseAdmin
    .from('organizer_applications')
    .select('id, user_id, requested_handle, bio, website, twitter, github, status')
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

  // Handle uniqueness kontrolü — başka kullanıcıya verilmiş olabilir (race)
  const { data: handleClash } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('handle', application.requested_handle)
    .maybeSingle()

  if (handleClash && handleClash.id !== application.user_id) {
    return NextResponse.json(
      { error: 'Bu handle bu sırada başka organizatöre atanmış.', code: 'HANDLE_TAKEN' },
      { status: 409 }
    )
  }

  const now = new Date().toISOString()

  // 1) Application'ı resolved'a çek
  const { error: appErr } = await supabaseAdmin
    .from('organizer_applications')
    .update({
      status: 'resolved',
      reviewed_by: user.id,
      reviewed_at: now,
    })
    .eq('id', applicationId)

  if (appErr) {
    return NextResponse.json(
      { error: 'Başvuru güncellenemedi.', code: 'UPDATE_FAILED' },
      { status: 500 }
    )
  }

  // 2) Profile güncelle
  const { error: profileErr } = await supabaseAdmin
    .from('profiles')
    .update({
      handle: application.requested_handle,
      bio: application.bio,
      website: application.website,
      twitter: application.twitter,
      github: application.github,
      is_organizer: true,
      verified_at: now,
    })
    .eq('id', application.user_id)

  if (profileErr) {
    // Rollback: application'ı open'a geri çek
    await supabaseAdmin
      .from('organizer_applications')
      .update({ status: 'open', reviewed_by: null, reviewed_at: null })
      .eq('id', applicationId)

    return NextResponse.json(
      { error: 'Profil güncellenemedi: ' + profileErr.message, code: 'PROFILE_UPDATE_FAILED' },
      { status: 500 }
    )
  }

  // 3) Bildirim
  await supabaseAdmin.from('notifications').insert({
    user_id: application.user_id,
    type: 'organizer_verified',
  })

  return NextResponse.json({
    success: true,
    handle: application.requested_handle,
    verified_at: now,
  })
}
