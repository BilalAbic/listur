import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { uploadEventCover } from '@/lib/storage/upload-cover'
import type { Database } from '@/types/database'

type EventUpdate = Database['public']['Tables']['events']['Update']

type Params = Promise<{ id: string }>

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const { id: eventId } = await params

  // Auth + rol kontrolü
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.', code: 'UNAUTHORIZED' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['moderator', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Yetersiz yetki.', code: 'FORBIDDEN' }, { status: 403 })
  }

  const supabaseAdmin = createAdminClient()

  // Etkinliği bul (organizer_id da takipçi bildirimi için gerekli)
  const { data: event } = await supabaseAdmin
    .from('events')
    .select('id, title, status, cover_image_og, cover_image, slug, organizer_id')
    .eq('id', eventId)
    .single()

  if (!event) return NextResponse.json({ error: 'Etkinlik bulunamadı.', code: 'NOT_FOUND' }, { status: 404 })
  if (event.status !== 'pending') {
    return NextResponse.json({ error: 'Bu etkinlik zaten işlenmiş.', code: 'ALREADY_PROCESSED' }, { status: 409 })
  }

  // İsteğe bağlı düzenleme alanları
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
  try { body = await request.json() } catch { /* gövde opsiyonel */ }

  // OG görselini Storage'a yükle (varsa)
  let coverImage = event.cover_image
  if (!coverImage && event.cover_image_og) {
    coverImage = await uploadEventCover(event.id, event.cover_image_og)
  }

  // Etkinliği yayınla
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
    return NextResponse.json({ error: 'Güncelleme başarısız.', code: 'UPDATE_FAILED' }, { status: 500 })
  }

  // moderation_logs'a yaz
  await supabaseAdmin.from('moderation_logs').insert({
    moderator_id: user.id,
    event_id: eventId,
    action: 'approved',
    note: body.note ?? null,
    changes: Object.keys(body).length > 0 ? body : null,
  })

  // Bildirim: gönderici varsa "onaylandı" bildirimi gönder
  const { data: submission } = await supabaseAdmin
    .from('submissions')
    .select('submitted_by')
    .eq('event_id', eventId)
    .order('submitted_at', { ascending: true })
    .limit(1)
    .single()

  // İki bildirim akışı:
  //  A) İlgi alanı eşleşen kullanıcılara `new_event`
  //  B) Takipçilere `organizer_new_event` (interests'la yakalananları DEDUPE et)
  // Hangi kullanıcılara hangi bildirim gittiği `notifiedUserIds` Set'inde tutulur.
  const notifiedUserIds = new Set<string>()

  if (submission) {
    await supabaseAdmin.from('notifications').insert({
      user_id: submission.submitted_by,
      event_id: eventId,
      type: 'submission_approved',
    })
    notifiedUserIds.add(submission.submitted_by)
  }

  // (A) Interests eşleşmesi
  const { data: eventData } = await supabaseAdmin
    .from('events')
    .select('category')
    .eq('id', eventId)
    .single()

  if (eventData) {
    let interestsQuery = supabaseAdmin
      .from('profiles')
      .select('id')
      .contains('interests', [eventData.category])

    if (submission) {
      interestsQuery = interestsQuery.neq('id', submission.submitted_by)
    }

    const { data: matchingUsers } = await interestsQuery

    if (matchingUsers && matchingUsers.length > 0) {
      const notifs = matchingUsers.map((u) => ({
        user_id: u.id,
        event_id: eventId,
        type: 'new_event' as const,
      }))
      await supabaseAdmin.from('notifications').insert(notifs)
      matchingUsers.forEach((u) => notifiedUserIds.add(u.id))
    }
  }

  // (B) Takipçilere organizer_new_event (interests dedupe)
  if (event.organizer_id) {
    const { data: followers } = await supabaseAdmin
      .from('organizer_follows')
      .select('follower_id')
      .eq('organizer_id', event.organizer_id)

    if (followers && followers.length > 0) {
      const followerIds = followers
        .map((f) => f.follower_id)
        .filter((id) => !notifiedUserIds.has(id) && id !== event.organizer_id)

      if (followerIds.length > 0) {
        const followerNotifs = followerIds.map((uid) => ({
          user_id: uid,
          event_id: eventId,
          type: 'organizer_new_event' as const,
        }))
        await supabaseAdmin.from('notifications').insert(followerNotifs)
      }
    }
  }

  return NextResponse.json({ success: true, message: 'Etkinlik yayınlandı.' })
}
