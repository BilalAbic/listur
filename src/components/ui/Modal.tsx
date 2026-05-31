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

const FOCUSABLE_SELECTOR =
  'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'

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
  // Modal açılmadan önce focus'lu eleman — kapatıldığında geri verilir.
  const triggerRef = useRef<Element | null>(null)

  // Escape + focus trap birlikte tek useEffect'te yönetilir.
  useEffect(() => {
    if (!open) return

    // Açılınca trigger'ı kaydet ve modal içindeki ilk focusable'a focus ver.
    triggerRef.current = document.activeElement
    const focusFirstInside = () => {
      const node = dialogRef.current
      if (!node) return
      const focusables = node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusables.length > 0) {
        focusables[0]?.focus()
      } else {
        // İçinde focusable yoksa dialog'un kendisine focus (tabindex=-1)
        node.focus()
      }
    }
    // requestAnimationFrame: DOM render sonrası focus
    const raf = requestAnimationFrame(focusFirstInside)

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        e.stopPropagation()
        onClose()
        return
      }
      // Focus trap: Tab/Shift+Tab modal sınırı içinde döngü
      if (e.key !== 'Tab') return
      const node = dialogRef.current
      if (!node) return
      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute('disabled'))
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]!
      const last = focusables[focusables.length - 1]!
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && (active === first || !node.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKey)

    // Kapanırken trigger'a focus iade et
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', handleKey)
      const trigger = triggerRef.current
      if (trigger instanceof HTMLElement) {
        trigger.focus()
      }
    }
  }, [open, closeOnEscape, onClose])

  if (!open) return null

  const titleId = title ? 'modal-title' : undefined

  return (
    // role="dialog" + aria-modal="true" — klavye yönetimi window-level
    // Escape ile yapılır (yukardaki useEffect'te). jsx-a11y/click-events-have-key-events
    // kuralı bu role-aware durumu görmüyor; onKeyDown no-op ile uyarıyı susturuyoruz.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
      onKeyDown={() => {
        /* Escape window listener tarafından yönetilir */
      }}
      data-testid={rest['data-testid']}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="document"
        className={`bg-white rounded-2xl shadow-2xl w-full ${SIZE_CLASSES[size]} p-6 sm:p-8 max-h-[90vh] overflow-y-auto focus:outline-none`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
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
