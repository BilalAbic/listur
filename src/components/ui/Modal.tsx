'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  /** Erişilebilirlik için modal başlığı (aria-labelledby ile bağlanır) */
  title?: string
  /** Maks. genişlik — default md (~28rem) */
  size?: 'sm' | 'md' | 'lg'
  /** Backdrop tıklanınca kapansın — default true */
  closeOnBackdrop?: boolean
  /** Escape tuşuyla kapansın — default true */
  closeOnEscape?: boolean
  /** Test/identification için */
  'data-testid'?: string
  children: ReactNode
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const

/**
 * Standart modal kabuğu — overlay + dialog wrapper.
 *
 * Mevcut 3 modal (InterestsModal, ReportModal, ModerationActionModal) hep
 * `fixed inset-0 z-50 + bg-black/60 + rounded-2xl + max-w-...` deseni yazıyor.
 * Bu bileşen o tekrarı tek yere taşır. İçerik (başlık, body, footer) yine
 * tüketici tarafında.
 */
export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  children,
  ...rest
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !closeOnEscape) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, closeOnEscape, onClose])

  if (!open) return null

  const titleId = title ? 'modal-title' : undefined

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
      data-testid={rest['data-testid']}
    >
      <div
        ref={dialogRef}
        className={`bg-white rounded-2xl shadow-2xl w-full ${SIZE_CLASSES[size]} p-6 sm:p-8 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 id={titleId} className="text-xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}
