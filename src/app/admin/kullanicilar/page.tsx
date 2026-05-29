import { createClient, createAdminClient } from '@/lib/supabase/server'
import { UsersList } from '@/components/moderation/UsersList'
import type { Metadata } from 'next'
import type { Database } from '@/types/database'

type UserRole = Database['public']['Enums']['user_role']

export const metadata: Metadata = { title: 'Kullanıcılar — Admin' }

export default async function AdminKullanicilarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { q = '', role = '', page = '1' } = await searchParams
  const pageNum = Math.max(1, parseInt(page))
  const pageSize = 25
  const from = (pageNum - 1) * pageSize

  const supabaseAdmin = createAdminClient()
  const query = supabaseAdmin
    .from('profiles')
    .select('id, name, email, role, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (q) {
    query.or(`name.ilike.%${q}%,email.ilike.%${q}%`)
  }
  const VALID_ROLES: UserRole[] = ['user', 'verified_user', 'moderator', 'admin']
  if (role && VALID_ROLES.includes(role as UserRole)) {
    query.eq('role', role as UserRole)
  }

  const { data: users, count } = await query
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Kullanıcılar</h2>
        <span className="text-sm text-gray-500">{count ?? 0} kullanıcı</span>
      </div>
      <UsersList
        users={users ?? []}
        currentQ={q}
        currentRole={role}
        currentPage={pageNum}
        totalPages={totalPages}
        currentUserId={user.id}
      />
    </div>
  )
}
