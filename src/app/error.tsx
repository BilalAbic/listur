'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    // Hataları bir izleme servisine gönderilebilir
    console.error('App error:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Bir Hata Oluştu</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        Beklenmedik bir hata meydana geldi. Lütfen tekrar deneyin.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 mb-6 font-mono">Hata kodu: {error.digest}</p>
      )}
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
        >
          Tekrar Dene
        </button>
        <a
          href="/"
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          Ana Sayfaya Dön
        </a>
      </div>
    </div>
  )
}
