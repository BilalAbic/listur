import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Admin Paneli',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/giris?redirect=/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  const navLinks = [
    { href: '/admin/bekleyenler', label: 'Bekleyenler' },
    { href: '/admin/etkinlikler', label: 'Etkinlikler' },
    { href: '/admin/raporlar', label: 'Raporlar' },
    { href: '/admin/kullanicilar', label: 'Kullanıcılar' },
    { href: '/admin/organizator-basvurulari', label: 'Organizatör Başvuruları' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admin Paneli</h1>
          <p className="text-sm text-gray-500">{profile.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/moderator"
            className="text-xs text-indigo-600 hover:underline"
          >
            Moderatör görünümü →
          </Link>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
            Admin
          </span>
        </div>
      </div>

      {/* Alt navigasyon */}
      <nav className="flex gap-1 mb-8 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex-1 text-center py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all whitespace-nowrap px-3"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  )
}
