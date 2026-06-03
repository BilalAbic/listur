import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** İç padding — default md */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Border + shadow gösterilsin mi — default true */
  bordered?: boolean
  /** Hover'da hafif yukarı kalkma efekti — listeleme kartları için */
  hoverable?: boolean
}

const PADDING_MAP = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} as const

export function Card({
  padding = 'md',
  bordered = true,
  hoverable = false,
  className,
  children,
  ...rest
}: CardProps) {
  const classes = [
    'bg-white rounded-2xl',
    bordered ? 'border border-gray-100 shadow-sm' : '',
    hoverable ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200' : '',
    PADDING_MAP[padding],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}
