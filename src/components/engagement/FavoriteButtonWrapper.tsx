'use client'

import { FavoriteButton } from './FavoriteButton'

type Variant = 'overlay' | 'full'

interface Props {
  eventId: string
  variant?: Variant
  redirectTo?: string
  count?: number
}

/**
 * Client component wrapper for FavoriteButton.
 * Bu sayede EventCard server component olabilir.
 */
export function FavoriteButtonWrapper({ eventId, variant = 'overlay', redirectTo, count }: Props) {
  return (
    <FavoriteButton
      eventId={eventId}
      variant={variant}
      redirectTo={redirectTo}
      count={count}
    />
  )
}
