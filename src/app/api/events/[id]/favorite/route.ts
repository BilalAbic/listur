import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

/**
 * POST /api/events/[id]/favorite
 * Etkinliği kullanıcının favorilerine ekler. Idempotent: zaten varsa hata vermez.
 */
export async function POST(_request: NextRequest, { params }: { params: Params }) {
  const { id: eventId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  // Etkinlik var ve yayında mı kontrolü (RLS de zaten kapatıyor ama net hata için)
  const { data: event } = await supabase
    .from('events')
    .select('id, status')
    .eq('id', eventId)
    .single()

  if (!event || event.status !== 'published') {
    return NextResponse.json({ error: 'Etkinlik bulunamadı.', code: 'NOT_FOUND' }, { status: 404 })
  }

  // Idempotent insert: zaten favoride ise sessiz geç
  const { error } = await supabase
    .from('favorites')
    .upsert(
      { user_id: user.id, event_id: eventId },
      { onConflict: 'user_id,event_id', ignoreDuplicates: true }
    )

  if (error) {
    return NextResponse.json(
      { error: 'Favorilere eklenemedi.', code: 'INSERT_FAILED' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, favorited: true })
}

/**
 * DELETE /api/events/[id]/favorite
 * Etkinliği kullanıcının favorilerinden çıkarır. Idempotent: yoksa hata vermez.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const { id: eventId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('event_id', eventId)

  if (error) {
    return NextResponse.json(
      { error: 'Favorilerden çıkarılamadı.', code: 'DELETE_FAILED' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, favorited: false })
}
