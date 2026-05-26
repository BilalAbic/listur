'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { INTEREST_CATEGORIES } from '@/types/index'

const CITIES = ['?stanbul', 'Ankara', '?zmir', 'Bursa', 'Antalya', 'Eski?ehir', 'Konya', 'Adana', 'Di?er']

export function EventFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const category = searchParams.get('kategori') ?? ''
  const city = searchParams.get('sehir') ?? ''
  const format = searchParams.get('format') ?? '' // online | yuzyuze
  const dateFilter = searchParams.get('tarih') ?? '' // bugun | bu-hafta | bu-ay

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Filtre de?i?ince ilk sayfaya d?n
      params.delete('sayfa')
      router.push(`/?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const clearAll = () => {
    router.push('/', { scroll: false })
  }

  const hasFilters = category || city || format || dateFilter

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Kategori */}
        <div className="flex-1 min-w-40">
          <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
          <select
            value={category}
            onChange={(e) => updateFilter('kategori', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">T?m?</option>
            {INTEREST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* ?ehir */}
        <div className="flex-1 min-w-36">
          <label className="block text-xs font-medium text-gray-500 mb-1">?ehir</label>
          <select
            value={city}
            onChange={(e) => updateFilter('sehir', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">T?m ?ehirler</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Format */}
        <div className="flex-1 min-w-32">
          <label className="block text-xs font-medium text-gray-500 mb-1">Format</label>
          <select
            value={format}
            onChange={(e) => updateFilter('format', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">T?m?</option>
            <option value="online">Online</option>
            <option value="yuzyuze">Y?z y?ze</option>
          </select>
        </div>

        {/* Tarih */}
        <div className="flex-1 min-w-32">
          <label className="block text-xs font-medium text-gray-500 mb-1">Tarih</label>
          <select
            value={dateFilter}
            onChange={(e) => updateFilter('tarih', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">T?m Zamanlar</option>
            <option value="bugun">Bug?n</option>
            <option value="bu-hafta">Bu Hafta</option>
            <option value="bu-ay">Bu Ay</option>
          </select>
        </div>

        {/* Temizle */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors border border-gray-200"
          >
            Temizle
          </button>
        )}
      </div>
    </div>
  )
}
