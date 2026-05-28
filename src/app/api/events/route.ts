import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils/slug'

export async function POST(request: NextRequest) {
  // Auth kontrolü
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Giriş yapmanız gerekiyor.', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // Kullanıcı rolünü kontrol et (en azından 'user' olmalı)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json(
      { error: 'Profil bulunamadı.', code: 'PROFILE_NOT_FOUND' },
      { status: 404 }
    )
  }

  // Request body
  let body: {
    title: string
    description?: string
    category: string
    city?: string
    is_online?: boolean
    venue_name?: string
    start_date: string
    end_date?: string
    registration_url?: string
    source_url: string
    cover_image_og?: string
    parse_source?: 'og' | 'gpt4o' | 'manual'
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Geçersiz istek gövdesi.', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  // Zorunlu alanlar
  if (!body.title || !body.category || !body.start_date || !body.source_url) {
    return NextResponse.json(
      { error: 'Başlık, kategori, başlangıç tarihi ve kaynak URL zorunludur.', code: 'MISSING_FIELDS' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createAdminClient()

  // Benzersiz slug üret
  const { data: existingSlugs } = await supabaseAdmin
    .from('events')
    .select('slug')
  const slugList = (existingSlugs ?? []).map((e) => e.slug)
  const slug = generateSlug(body.title, slugList)

  // Onaylı kullanıcı ise direkt yayınla, değilse pending
  const isVerified = profile.role === 'verified_user' || profile.role === 'moderator' || profile.role === 'admin'
  const status = isVerified ? 'published' : 'pending'

  // Etkinliği kaydet
  const { data: event, error: insertError } = await supabaseAdmin
    .from('events')
    .insert({
      title: body.title,
      description: body.description ?? null,
      category: body.category,
      city: body.city ?? null,
      is_online: body.is_online ?? false,
      venue_name: body.venue_name ?? null,
      start_date: body.start_date,
      end_date: body.end_date ?? null,
      registration_url: body.registration_url ?? null,
      source_url: body.source_url,
      cover_image_og: body.cover_image_og ?? null,
      organizer_id: user.id,
      status,
      slug,
      published_at: isVerified ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Event insert error:', insertError)
    return NextResponse.json(
      { error: 'Etkinlik kaydedilemedi.', code: 'INSERT_FAILED' },
      { status: 500 }
    )
  }

  // Submission kaydı oluştur
  await supabaseAdmin.from('submissions').insert({
    event_id: event.id,
    submitted_by: user.id,
    raw_url: body.source_url,
    parse_source: body.parse_source ?? 'manual',
  })

  return NextResponse.json({
    success: true,
    event: { id: event.id, slug: event.slug, status: event.status },
    message: isVerified
      ? 'Etkinlik yayınlandı!'
      : 'Etkinlik gönderildi. Moderatör onayından sonra yayınlanacak.',
  })
}
