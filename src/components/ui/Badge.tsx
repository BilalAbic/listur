import type { HTMLAttributes } from 'react'

type Tone = 'gray' | 'indigo' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'blue' | 'pink' | 'teal' | 'emerald'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  size?: 'sm' | 'md'
}

const TONE_CLASSES: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-600',
  indigo: 'bg-indigo-100 text-indigo-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  blue: 'bg-blue-100 text-blue-700',
  pink: 'bg-pink-100 text-pink-700',
  teal: 'bg-teal-100 text-teal-700',
  emerald: 'bg-emerald-100 text-emerald-700',
}

const SIZE_CLASSES = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2.5 py-1',
} as const

export function Badge({ tone = 'gray', size = 'md', className, children, ...rest }: BadgeProps) {
  const classes = [
    'inline-flex items-center font-semibold rounded-full',
    TONE_CLASSES[tone],
    SIZE_CLASSES[size],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  )
}

/** Kategori adından tone mapleyen yardımcı — mevcut EventCard renk sözlüğünü tek yere taşır. */
const CATEGORY_TONE_MAP: Record<string, Tone> = {
  'Yapay Zeka / ML': 'purple',
  'Blockchain / Web3': 'orange',
  'Mobil Geliştirme': 'blue',
  'Backend / DevOps': 'green',
  'Siber Güvenlik': 'red',
  'Girişimcilik / Startup': 'yellow',
  'Tasarım / UX': 'pink',
  'Oyun Geliştirme': 'indigo',
  'Veri Bilimi': 'teal',
  'Açık Kaynak': 'emerald',
}

export function categoryTone(category: string): Tone {
  return CATEGORY_TONE_MAP[category] ?? 'gray'
}
