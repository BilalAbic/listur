import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildGoogleCalendarUrl } from '@/lib/calendar'

type Params = Promise<{ id: string }>

/**
 * GET /api/events/[id]/google-calendar
 *
 * Google Calendar "Quick add" formuna 302 redirect. Public.
 * Kullanıcı Google Calendar'da ön-doldurulmuş etkinlik formunu görür.
 */
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const { id } = await params

  const supabase = await createClient()

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const query = supabase
    .from('events')
    .select(
      'id, slug, title, description, start_date, end_date, city, venue_name, is_online, status'
    )
    .eq('status', 'published')

  const { data: event } = isUuid
    ? await query.eq('id', id).maybeSingle()
    : await query.eq('slug', id).maybeSingle()

  if (!event) {
    return NextResponse.json(
      { error: 'Etkinlik bulunamadı.', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const googleUrl = buildGoogleCalendarUrl(event)

  return NextResponse.redirect(googleUrl, { status: 302 })
}
