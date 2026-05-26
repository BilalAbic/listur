import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sayfa Bulunamad? ? Listur',
}

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl font-black text-gray-100 mb-4 select-none">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Sayfa Bulunamad?</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        Arad???n?z sayfa ta??nm??, silinmi? veya hi? var olmam?? olabilir.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
        >
          Ana Sayfaya D?n
        </Link>
        <Link
          href="/etkinlik-gonder"
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          Etkinlik Ekle
        </Link>
      </div>
    </div>
  )
}
