import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/cron/reminders
 *
 * Vercel Cron Job tarafından saatlik çağrılır. Authorization: Bearer ${CRON_SECRET}
 * header'ı zorunlu — production'a giderken Vercel cron otomatik bu header'ı set eder.
 *
 * İki pencere için RSVP'leri tarar ve `event_reminder` bildirimleri oluşturur:
 *  • 24 saat penceresi: start_date ∈ [now+23h, now+25h]  → reminder_24h_sent flag
 *  • 1 saat penceresi:  start_date ∈ [now+30m, now+90m]  → reminder_1h_sent flag
 *
 * RSVP üzerindeki flag sayesinde idempotent — saatlik çalışsa bile aynı kullanıcıya
 * iki kez bildirim gitmez.
 *
 * NOT: Supabase RPC fonksiyonu kullanmıyoruz çünkü migration'a CREATE FUNCTION
 * eklemek ileride bakım yükü. Aynı atomikliği iki adımda (SELECT + INSERT + UPDATE)
 * sağlıyoruz; tek transaction içinde değil ama duplicate riski yok (UPDATE
 * sonrasında flag=true → bir sonraki run yakalamaz).
 */
export async function GET(request: NextRequest) {
  // Auth — Vercel Cron veya manuel test
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET ayarlanmamış.', code: 'NOT_CONFIGURED' },
      { status: 500 }
    )
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { error: 'Yetkisiz.', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const supabaseAdmin = createAdminClient()
  const startedAt = Date.now()

  // 24h penceresi
  const inserted24h = await processWindow(supabaseAdmin, '24h')
  // 1h penceresi
  const inserted1h = await processWindow(supabaseAdmin, '1h')

  return NextResponse.json({
    success: true,
    duration_ms: Date.now() - startedAt,
    inserted_24h: inserted24h,
    inserted_1h: inserted1h,
    timestamp: new Date().toISOString(),
  })
}

type Window = '24h' | '1h'

interface EligibleRow {
  user_id: string
  event_id: string
}

/**
 * Pencere için: eligible RSVP'leri bul → notifications insert → RSVP flag set.
 * Returns: insert edilen bildirim sayısı.
 */
async function processWindow(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  window: Window
): Promise<number> {
  const flagColumn = window === '24h' ? 'reminder_24h_sent' : 'reminder_1h_sent'

  // Pencere SQL hesaplamak için PostgreSQL'in now() interval syntax'i en doğru
  // ama supabase-js ile filter chain'de interval geçemiyoruz. JS tarafında hesapla.
  const now = Date.now()
  const startMs = window === '24h' ? now + 23 * 60 * 60 * 1000 : now + 30 * 60 * 1000
  const endMs = window === '24h' ? now + 25 * 60 * 60 * 1000 : now + 90 * 60 * 1000
  const startIso = new Date(startMs).toISOString()
  const endIso = new Date(endMs).toISOString()

  // Eligible RSVP'ler: status going/interested, flag false, event published, pencere içinde
  // events JOIN için inner select kullanıyoruz; PostgREST `events!inner` syntax'i.
  const { data: eligible, error: selectError } = await supabaseAdmin
    .from('rsvps')
    .select(
      `user_id, event_id, events!inner(id, status, start_date)`
    )
    .in('status', ['going', 'interested'])
    .eq(flagColumn, false)
    .eq('events.status', 'published')
    .gte('events.start_date', startIso)
    .lt('events.start_date', endIso)

  if (selectError) {
    console.error(`[cron/reminders] ${window} select failed:`, selectError)
    return 0
  }

  const rows = (eligible ?? []) as unknown as EligibleRow[]
  if (rows.length === 0) return 0

  // Bildirim insert
  const notifications = rows.map((r) => ({
    user_id: r.user_id,
    event_id: r.event_id,
    type: 'event_reminder' as const,
  }))

  const { error: insertError } = await supabaseAdmin
    .from('notifications')
    .insert(notifications)

  if (insertError) {
    console.error(`[cron/reminders] ${window} insert failed:`, insertError)
    return 0
  }

  // RSVP flag set — eldeki (user_id, event_id) çiftleri için
  // Supabase typed update literal kolon adı bekler; conditional ile iki kolon.
  const updatePayload =
    window === '24h'
      ? { reminder_24h_sent: true }
      : { reminder_1h_sent: true }

  for (const row of rows) {
    await supabaseAdmin
      .from('rsvps')
      .update(updatePayload)
      .eq('user_id', row.user_id)
      .eq('event_id', row.event_id)
  }

  return notifications.length
}
