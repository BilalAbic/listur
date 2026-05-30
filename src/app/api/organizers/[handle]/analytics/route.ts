import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

type Params = Promise<{ handle: string }>

interface EventAnalyticsRow {
  id: string
  title: string
  slug: string
  status: string
  start_date: string
  view_count: number
  favorite_count: number
  rsvp_count: number
}

/**
 * GET /api/organizers/[handle]/analytics
 *
 * Self veya admin yetkili. Diğer kullanıcılar 403.
 *
 * Response:
 * {
 *   handle, name, follower_count, verified_at, is_organizer,
 *   totals: { view_count, favorite_count, rsvp_count, event_count, published_count },
 *   events: [ { id, title, slug, status, start_date, view_count, fav, rsvp } ]
 * }
 */
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const { handle } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const supabaseAdmin = createAdminClient()

  // Organizatör profilini handle'a göre çek
  const { data: organizer } = await supabaseAdmin
    .from('profiles')
    .select('id, handle, name, follower_count, verified_at, is_organizer')
    .eq('handle', handle)
    .maybeSingle()

  if (!organizer || !organizer.is_organizer) {
    return NextResponse.json(
      { error: 'Organizatör bulunamadı.', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // Yetki: kendi profili veya admin
  const { data: actor } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isOwner = user.id === organizer.id
  const isAdmin = actor?.role === 'admin'

  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: 'Bu analytics sadece organizatörün kendisine veya admin\'e açıktır.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  // Etkinlik sayaçları
  const { data: events } = await supabaseAdmin
    .from('events')
    .select('id, title, slug, status, start_date, view_count, favorite_count, rsvp_count')
    .eq('organizer_id', organizer.id)
    .order('start_date', { ascending: false })

  const rows = (events ?? []) as EventAnalyticsRow[]
  const publishedRows = rows.filter((e) => e.status === 'published')

  const totals = rows.reduce(
    (acc, e) => {
      acc.view_count += e.view_count
      acc.favorite_count += e.favorite_count
      acc.rsvp_count += e.rsvp_count
      return acc
    },
    { view_count: 0, favorite_count: 0, rsvp_count: 0 }
  )

  return NextResponse.json({
    handle: organizer.handle,
    name: organizer.name,
    follower_count: organizer.follower_count,
    verified_at: organizer.verified_at,
    totals: {
      ...totals,
      event_count: rows.length,
      published_count: publishedRows.length,
    },
    events: rows,
  })
}
