import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { event_id, reason, description } = body

  if (!event_id || !reason) {
    return NextResponse.json({ error: 'event_id ve reason zorunlu.', code: 'MISSING_FIELDS' }, { status: 400 })
  }

  const allowedReasons = ['misleading', 'spam', 'irrelevant', 'inappropriate', 'other']
  if (!allowedReasons.includes(reason)) {
    return NextResponse.json({ error: 'Geçersiz sebep.', code: 'INVALID_REASON' }, { status: 400 })
  }

  // IP adresi
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  // Giriş yapmış kullanıcıyı kontrol et (opsiyonel)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const supabaseAdmin = createAdminClient()

  // Rate limiting: aynı IP'den 10 dakikada 1 rapor
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabaseAdmin
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('reporter_ip', clientIp)
    .gte('created_at', tenMinutesAgo)

  if ((recentCount ?? 0) >= 1) {
    return NextResponse.json(
      { error: 'Çok sık rapor gönderdiniz. Lütfen 10 dakika bekleyin.', code: 'RATE_LIMITED' },
      { status: 429 }
    )
  }

  // Kayıtlı kullanıcı: aynı event_id için tekrar rapor kontrolü
  if (user) {
    const { count: existingCount } = await supabaseAdmin
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('reported_by', user.id)
      .eq('event_id', event_id)

    if ((existingCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Bu etkinliği zaten raporladınız.', code: 'ALREADY_REPORTED' },
        { status: 409 }
      )
    }
  }

  // Etkinlik var mı?
  const { data: event } = await supabaseAdmin
    .from('events')
    .select('id, status')
    .eq('id', event_id)
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Etkinlik bulunamadı.', code: 'EVENT_NOT_FOUND' }, { status: 404 })
  }

  if (event.status !== 'published') {
    return NextResponse.json({ error: 'Sadece yayındaki etkinlikler raporlanabilir.', code: 'NOT_PUBLISHED' }, { status: 400 })
  }

  // Raporu kaydet
  const { error: insertError } = await supabaseAdmin.from('reports').insert({
    event_id,
    reason,
    description: description?.trim() || null,
    reported_by: user?.id ?? null,
    reporter_ip: clientIp,
    status: 'open',
  })

  if (insertError) {
    // Unique constraint ihlali: IP + event_id
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: 'Bu etkinliği zaten raporladınız.', code: 'ALREADY_REPORTED' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Rapor kaydedilemedi.', code: 'INSERT_FAILED' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Raporunuz alındı. İnceleyeceğiz.' })
}
