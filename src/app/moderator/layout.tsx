import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Moderatör Paneli — Listur',
}

export default async function ModeratorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/giris?redirect=/moderator')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (!profile || !['moderator', 'admin'].includes(profile.role)) {
    redirect('/')
  }

  const navLinks = [
    { href: '/moderator/bekleyenler', label: 'Bekleyenler' },
    { href: '/moderator/onayladiklarim', label: 'Onayladıklarım' },
    { href: '/moderator/raporlar', label: 'Raporlar' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Moderatör Paneli</h1>
          <p className="text-sm text-gray-500">{profile.name}</p>
        </div>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
          {profile.role === 'admin' ? 'Admin' : 'Moderatör'}
        </span>
      </div>

      {/* Alt navigasyon */}
      <nav className="flex gap-1 mb-8 bg-gray-100 rounded-xl p-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex-1 text-center py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  )
}
