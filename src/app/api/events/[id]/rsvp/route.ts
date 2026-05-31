import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type RsvpStatus = Database['public']['Enums']['rsvp_status']
type Params = Promise<{ id: string }>

const VALID_STATUSES: RsvpStatus[] = ['going', 'interested', 'not_going']

interface RsvpBody {
  status?: string
}

/**
 * POST /api/events/[id]/rsvp
 * RSVP'yi oluşturur veya günceller (upsert).
 * Body: { status: 'going' | 'interested' | 'not_going' }
 */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const { id: eventId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  let body: RsvpBody = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Geçersiz istek gövdesi.', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  const status = body.status as RsvpStatus | undefined
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: 'Geçersiz RSVP durumu.', code: 'INVALID_STATUS' },
      { status: 400 }
    )
  }

  // Etkinlik var ve yayında mı kontrolü
  const { data: event } = await supabase
    .from('events')
    .select('id, status')
    .eq('id', eventId)
    .single()

  if (!event || event.status !== 'published') {
    return NextResponse.json({ error: 'Etkinlik bulunamadı.', code: 'NOT_FOUND' }, { status: 404 })
  }

  // Upsert: aynı (user, event) için satır varsa status'u günceller, yoksa ekler
  // Status değişince hatırlatıcı flag'leri sıfırlanır (yeni karar = yeni hatırlatma)
  const { error } = await supabase
    .from('rsvps')
    .upsert(
      {
        user_id: user.id,
        event_id: eventId,
        status,
        reminder_24h_sent: false,
        reminder_1h_sent: false,
      },
      { onConflict: 'user_id,event_id' }
    )

  if (error) {
    return NextResponse.json(
      { error: 'RSVP kaydedilemedi.', code: 'UPSERT_FAILED' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, status })
}

/**
 * DELETE /api/events/[id]/rsvp
 * RSVP'yi tamamen siler. Idempotent.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const { id: eventId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { error } = await supabase
    .from('rsvps')
    .delete()
    .eq('user_id', user.id)
    .eq('event_id', eventId)

  if (error) {
    return NextResponse.json(
      { error: 'RSVP silinemedi.', code: 'DELETE_FAILED' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, status: null })
}
