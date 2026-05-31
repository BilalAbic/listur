'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface UserItem {
  id: string
  name: string | null
  email: string | null
  role: string
  created_at: string
}

interface Props {
  users: UserItem[]
  currentQ: string
  currentRole: string
  currentPage: number
  totalPages: number
  currentUserId: string
}

const ROLE_OPTIONS = [
  { value: '', label: 'Tüm Roller' },
  { value: 'user', label: 'Kullanıcı' },
  { value: 'verified_user', label: 'Doğrulanmış' },
  { value: 'moderator', label: 'Moderatör' },
  { value: 'admin', label: 'Admin' },
]

const roleBadge: Record<string, string> = {
  user: 'bg-gray-100 text-gray-600',
  verified_user: 'bg-blue-100 text-blue-700',
  moderator: 'bg-indigo-100 text-indigo-700',
  admin: 'bg-purple-100 text-purple-700',
}

const roleLabel: Record<string, string> = {
  user: 'Kullanıcı',
  verified_user: 'Doğrulanmış',
  moderator: 'Moderatör',
  admin: 'Admin',
}

export function UsersList({ users, currentQ, currentRole, currentPage, totalPages, currentUserId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(currentQ)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState('')

  const navigate = (q: string, role: string, page = 1) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (role) params.set('role', role)
    if (page > 1) params.set('page', String(page))
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(search, currentRole)
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUserId) {
      setError('Kendi rolünüzü değiştiremezsiniz.')
      return
    }
    setUpdating(userId)
    setError('')

    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Güncelleme başarısız.')
        return
      }
      router.refresh()
    } finally {
      setUpdating(null)
    }
  }

  return (
    <>
      {/* Arama ve filtre */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim veya e-posta ara…"
            aria-label="Kullanıcı ara"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button type="submit">Ara</Button>
        </form>
        <select
          value={currentRole}
          onChange={(e) => navigate(currentQ, e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {users.length === 0 ? (
        <div className="py-16 text-center text-gray-500">Kullanıcı bulunamadı.</div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">
                    {user.name ?? 'İsimsiz'}
                  </span>
                  {user.id === currentUserId && (
                    <span className="text-xs text-gray-400">(siz)</span>
                  )}
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${roleBadge[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {roleLabel[user.role] ?? user.role}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {user.id !== currentUserId && (
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={updating === user.id}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {ROLE_OPTIONS.filter((r) => r.value !== '').map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="secondary"
            onClick={() => navigate(currentQ, currentRole, currentPage - 1)}
            disabled={currentPage <= 1}
          >
            ← Önceki
          </Button>
          <span className="text-sm text-gray-500 px-2">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => navigate(currentQ, currentRole, currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Sonraki →
          </Button>
        </div>
      )}
    </>
  )
}
