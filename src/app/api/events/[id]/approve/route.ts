import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { uploadEventCover } from '@/lib/storage/upload-cover'
import type { Database } from '@/types/database'

type EventUpdate = Database['public']['Tables']['events']['Update']

type Params = Promise<{ id: string }>

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const { id: eventId } = await params

  // Auth + rol kontrol?
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.', code: 'UNAUTHORIZED' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['moderator', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Yetersiz yetki.', code: 'FORBIDDEN' }, { status: 403 })
  }

  const supabaseAdmin = createAdminClient()

  // Etkinli?i bul
  const { data: event } = await supabaseAdmin
    .from('events')
    .select('id, title, status, cover_image_og, cover_image, slug')
    .eq('id', eventId)
    .single()

  if (!event) return NextResponse.json({ error: 'Etkinlik bulunamad?.', code: 'NOT_FOUND' }, { status: 404 })
  if (event.status !== 'pending') {
    return NextResponse.json({ error: 'Bu etkinlik zaten i?lenmi?.', code: 'ALREADY_PROCESSED' }, { status: 409 })
  }

  // ?ste?e ba?l? d?zenleme alanlar?
  let body: {
    note?: string
    title?: string
    description?: string
    category?: string
    city?: string
    is_online?: boolean
    venue_name?: string
    start_date?: string
    end_date?: string
    registration_url?: string
  } = {}
  try { body = await request.json() } catch { /* g?vde opsiyonel */ }

  // OG g?rselini Storage'a y?kle (varsa)
  let coverImage = event.cover_image
  if (!coverImage && event.cover_image_og) {
    coverImage = await uploadEventCover(event.id, event.cover_image_og)
  }

  // Etkinli?i yay?nla
  const updateData: EventUpdate = {
    status: 'published',
    published_at: new Date().toISOString(),
    ...(coverImage ? { cover_image: coverImage } : {}),
    ...(body.title ? { title: body.title } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.category ? { category: body.category } : {}),
    ...(body.city !== undefined ? { city: body.city } : {}),
    ...(body.is_online !== undefined ? { is_online: body.is_online } : {}),
    ...(body.venue_name !== undefined ? { venue_name: body.venue_name } : {}),
    ...(body.start_date ? { start_date: body.start_date } : {}),
    ...(body.end_date !== undefined ? { end_date: body.end_date } : {}),
    ...(body.registration_url !== undefined ? { registration_url: body.registration_url } : {}),
  }

  const { error: updateError } = await supabaseAdmin
    .from('events')
    .update(updateData)
    .eq('id', eventId)

  if (updateError) {
    return NextResponse.json({ error: 'G?ncelleme ba?ar?s?z.', code: 'UPDATE_FAILED' }, { status: 500 })
  }

  // moderation_logs'a yaz
  await supabaseAdmin.from('moderation_logs').insert({
    moderator_id: user.id,
    event_id: eventId,
    action: 'approved',
    note: body.note ?? null,
    changes: Object.keys(body).length > 0 ? body : null,
  })

  // Bildirim: g?nderici varsa "onayland?" bildirimi g?nder
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
      type: 'submission_approved',
    })

    // Etkinli?in ilgi alan?yla e?le?en kullan?c?lara bildirim g?nder
    const { data: eventData } = await supabaseAdmin
      .from('events')
      .select('category')
      .eq('id', eventId)
      .single()

    if (eventData) {
      const { data: matchingUsers } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .contains('interests', [eventData.category])
        .neq('id', submission.submitted_by) // G?nderici zaten bildirim ald?

      if (matchingUsers && matchingUsers.length > 0) {
        const notifs = matchingUsers.map((u) => ({
          user_id: u.id,
          event_id: eventId,
          type: 'new_event' as const,
        }))
        await supabaseAdmin.from('notifications').insert(notifs)
      }
    }
  }

  return NextResponse.json({ success: true, message: 'Etkinlik yay?nland?.' })
}
