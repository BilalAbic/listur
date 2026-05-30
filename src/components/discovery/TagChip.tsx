import Link from 'next/link'

interface Props {
  tag: string
  size?: 'sm' | 'md'
  /** Tıklanabilirse arama sayfasına yönlendirir. Default true */
  linkable?: boolean
}

/**
 * TagChip — read-only etiket gösterimi.
 * `linkable` ise tıklanınca /ara?q=tag arar (URL'de q parametresi).
 */
export function TagChip({ tag, size = 'sm', linkable = true }: Props) {
  const sizeCls = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
  const cls = `inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 font-medium ${sizeCls} hover:bg-indigo-100 transition-colors`

  if (!linkable) {
    return <span className={cls}>#{tag}</span>
  }
  return (
    <Link
      href={`/ara?q=${encodeURIComponent(tag)}`}
      onClick={(e) => e.stopPropagation()}
      className={cls}
    >
      #{tag}
    </Link>
  )
}
