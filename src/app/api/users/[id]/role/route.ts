import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const { id: targetUserId } = await params

  // Sadece admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.', code: 'UNAUTHORIZED' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Sadece adminler rol değiştirebilir.', code: 'FORBIDDEN' }, { status: 403 })
  }

  const { role } = await request.json()
  const allowedRoles = ['user', 'verified_user', 'moderator', 'admin']
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: 'Geçersiz rol.', code: 'INVALID_ROLE' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', targetUserId)

  if (error) return NextResponse.json({ error: 'Güncelleme başarısız.', code: 'UPDATE_FAILED' }, { status: 500 })

  return NextResponse.json({ success: true, message: `Rol güncellendi: ${role}` })
}
