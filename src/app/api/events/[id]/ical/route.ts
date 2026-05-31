import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildIcs } from '@/lib/calendar'

type Params = Promise<{ id: string }>

/**
 * GET /api/events/[id]/ical
 *
 * RFC 5545 uyumlu .ics dosyası döndürür. Public — login gerekmez.
 * `id` parametresi event UUID'si veya slug olabilir; iki sorguyu da deneriz.
 *
 * Content-Type: text/calendar; charset=utf-8
 * Content-Disposition: attachment; filename="<slug>.ics"
 */
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const { id } = await params

  const supabase = await createClient()

  // Hem UUID hem slug ile deneme (route /api/events/<slug>/ical ile de çalışsın)
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

  const ics = buildIcs(event)

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.slug}.ics"`,
      // Etkinlik içeriği değişirse cache yenilenir; 5 dk make sense
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
