import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = Promise<{ handle: string }>

/**
 * POST /api/organizers/[handle]/follow
 *
 * Login kullanıcının belirtilen organizatörü takip etmesini sağlar.
 * Idempotent — zaten takiptesi ise hata vermez. Kendi handle'ını takip edemez.
 */
export async function POST(_request: NextRequest, { params }: { params: Params }) {
  const { handle } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  // Hedef organizatörü bul
  const { data: organizer } = await supabase
    .from('profiles')
    .select('id, is_organizer')
    .eq('handle', handle)
    .maybeSingle()

  if (!organizer) {
    return NextResponse.json(
      { error: 'Organizatör bulunamadı.', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  if (organizer.id === user.id) {
    return NextResponse.json(
      { error: 'Kendi profilini takip edemezsin.', code: 'SELF_FOLLOW' },
      { status: 400 }
    )
  }

  // Idempotent upsert
  const { error } = await supabase
    .from('organizer_follows')
    .upsert(
      { follower_id: user.id, organizer_id: organizer.id },
      { onConflict: 'follower_id,organizer_id', ignoreDuplicates: true }
    )

  if (error) {
    return NextResponse.json(
      { error: 'Takip edilemedi.', code: 'INSERT_FAILED' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, following: true })
}

/**
 * DELETE /api/organizers/[handle]/follow
 * Takipten çıkarır. Idempotent.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const { handle } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { data: organizer } = await supabase
    .from('profiles')
    .select('id')
    .eq('handle', handle)
    .maybeSingle()

  if (!organizer) {
    return NextResponse.json(
      { error: 'Organizatör bulunamadı.', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const { error } = await supabase
    .from('organizer_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('organizer_id', organizer.id)

  if (error) {
    return NextResponse.json(
      { error: 'Takipten çıkarılamadı.', code: 'DELETE_FAILED' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, following: false })
}
