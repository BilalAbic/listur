import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadEventCover } from '@/lib/storage/upload-cover'

export async function POST(request: NextRequest) {
  // Sadece mod/admin çağırabilir (onay akışından)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['moderator', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Yetersiz yetki.', code: 'FORBIDDEN' }, { status: 403 })
  }

  const { eventId, imageUrl } = await request.json()

  if (!eventId || !imageUrl) {
    return NextResponse.json(
      { error: 'eventId ve imageUrl zorunludur.', code: 'MISSING_FIELDS' },
      { status: 400 }
    )
  }

  const cdnUrl = await uploadEventCover(eventId, imageUrl)

  if (!cdnUrl) {
    return NextResponse.json(
      { error: 'Görsel yüklenemedi.', code: 'UPLOAD_FAILED' },
      { status: 422 }
    )
  }

  return NextResponse.json({ success: true, cdnUrl })
}
