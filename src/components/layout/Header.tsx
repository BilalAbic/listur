'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/hooks/useNotifications'
import { SearchBar } from '@/components/discovery/SearchBar'

export function Header() {
  const { user, profile, signOut } = useAuth()
  const { unreadCount } = useNotifications()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Sol grup: logo + ana navigasyon */}
        <div className="flex items-center gap-5">
          <Link href="/" className="font-bold text-xl text-indigo-600 tracking-tight hover:text-indigo-700 transition-colors">
            Listur
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm font-medium text-gray-600">
            <Link href="/takvim" className="hover:text-gray-900 transition-colors">
              Takvim
            </Link>
          </nav>
        </div>

        {/* Orta: arama (md+) */}
        <div className="hidden md:block flex-1 max-w-md mx-6">
          <SearchBar variant="compact" />
        </div>

        {/* Sağ navigasyon */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Etkinlik gönder butonu */}
              <Link
                href="/etkinlik-gonder"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                <span>+ Etkinlik Ekle</span>
              </Link>

              {/* Bildirim çanı */}
              <Link
                href="/bildirimler"
                className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Bildirimler"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Kullanıcı menüsü */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm flex items-center justify-center">
                    {(profile?.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-sm font-medium text-gray-900 truncate">{profile?.name || 'Kullanıcı'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link href="/profil" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Profil
                      </Link>
                      {profile?.is_organizer ? (
                        <Link href="/profil/organizator" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Organizatör Paneli
                        </Link>
                      ) : (
                        <Link href="/profil/organizator-basvuru" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Organizatör Ol
                        </Link>
                      )}
                      {(profile?.role === 'moderator' || profile?.role === 'admin') && (
                        <Link href="/moderator" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Moderatör Paneli
                        </Link>
                      )}
                      {profile?.role === 'admin' && (
                        <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Admin Paneli
                        </Link>
                      )}
                      <button
                        onClick={() => { signOut(); setMenuOpen(false) }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Çıkış Yap
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/giris" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Giriş Yap
              </Link>
              <Link
                href="/giris?tab=signup"
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
