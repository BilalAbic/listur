'use client'

import { useState } from 'react'
import { ReportModal } from '@/components/modals/ReportModal'

interface Props {
  eventId: string
  eventTitle: string
}

export function ReportButton({ eventId, eventTitle }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
      >
        Uygunsuz içerik bildir
      </button>
      {open && (
        <ReportModal
          eventId={eventId}
          eventTitle={eventTitle}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
