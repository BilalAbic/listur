import { type NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { validateApplication } from '@/lib/organizer-validation'

/**
 * POST /api/organizers/apply
 *
 * Login kullanıcı organizatör doğrulama başvurusu gönderir.
 *
 * - Body: { requested_handle, bio, website, twitter, github, reason }
 * - Handle uniqueness: profiles.handle + open organizer_applications.requested_handle
 * - Aynı kullanıcının açık başvurusu varsa 409 (DB UNIQUE WHERE status='open' constraint'i de yakalar)
 * - Zaten is_organizer=true ise 409 (yeni başvuru gereksiz)
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Geçersiz istek gövdesi.', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  const validation = validateApplication(body as Record<string, unknown>)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error, code: validation.code }, { status: 400 })
  }
  const fields = validation.data

  const supabaseAdmin = createAdminClient()

  // Kullanıcı zaten organizatör mü?
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, is_organizer')
    .eq('id', user.id)
    .single()

  if (profile?.is_organizer) {
    return NextResponse.json(
      { error: 'Zaten doğrulanmış organizatörsün.', code: 'ALREADY_ORGANIZER' },
      { status: 409 }
    )
  }

  // Aynı kullanıcının açık başvurusu var mı?
  const { data: existingOpen } = await supabaseAdmin
    .from('organizer_applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'open')
    .maybeSingle()

  if (existingOpen) {
    return NextResponse.json(
      { error: 'Zaten açık bir başvurun var. Lütfen sonucu bekle.', code: 'APPLICATION_PENDING' },
      { status: 409 }
    )
  }

  // Handle uniqueness — profiles.handle veya başka kullanıcının açık başvurusu
  const { data: handleClash } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('handle', fields.requested_handle)
    .maybeSingle()

  if (handleClash && handleClash.id !== user.id) {
    return NextResponse.json(
      { error: 'Bu handle başka bir organizatör tarafından alınmış.', code: 'HANDLE_TAKEN' },
      { status: 409 }
    )
  }

  const { data: otherOpen } = await supabaseAdmin
    .from('organizer_applications')
    .select('id, user_id')
    .eq('requested_handle', fields.requested_handle)
    .eq('status', 'open')
    .maybeSingle()

  if (otherOpen && otherOpen.user_id !== user.id) {
    return NextResponse.json(
      { error: 'Bu handle için açık bir başvuru zaten var.', code: 'HANDLE_PENDING' },
      { status: 409 }
    )
  }

  // Insert
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('organizer_applications')
    .insert({
      user_id: user.id,
      requested_handle: fields.requested_handle,
      bio: fields.bio,
      website: fields.website,
      twitter: fields.twitter,
      github: fields.github,
      reason: fields.reason,
      status: 'open',
    })
    .select('id, created_at')
    .single()

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: 'Başvuru kaydedilemedi.', code: 'INSERT_FAILED' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    application_id: inserted.id,
    created_at: inserted.created_at,
  })
}
