/**
 * VerifiedBadge — "Doğrulanmış Organizatör" rozeti.
 *
 * NOT: Bu rozet `verified_user` rolünden farklıdır. Organizatör doğrulaması
 * Sprint 4'te admin onayıyla `profiles.verified_at` doldurulduğunda görünür.
 */
interface Props {
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function VerifiedBadge({ size = 'md', showLabel = false }: Props) {
  const sizes = {
    sm: { icon: 'w-3.5 h-3.5', text: 'text-[10px]' },
    md: { icon: 'w-4 h-4', text: 'text-xs' },
    lg: { icon: 'w-5 h-5', text: 'text-sm' },
  }
  const s = sizes[size]

  return (
    <span
      className={`inline-flex items-center gap-1 ${s.text} text-indigo-600`}
      title="Doğrulanmış Organizatör"
    >
      <svg
        className={s.icon}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 1.5l2.1 2.85 3.6.6 1.05 3.45 2.55 2.55-1.5 3.3.45 3.6-3.3 1.5-2.55 2.55-3.45-1.05L9 21.45 6.6 18.6 3 17.55l.45-3.6-1.5-3.3 2.55-2.55L4.5 4.65l3.6-.6L9 1.5l1.5 1.05L12 1.5z" opacity=".15" />
        <path
          fillRule="evenodd"
          d="M12.97 2.05c.34.04.66.18.92.42l1.51 1.4 2.05.36c.66.12 1.18.64 1.3 1.3l.36 2.05 1.4 1.51c.46.5.6 1.22.36 1.85l-.76 1.94.26 2.06c.08.66-.28 1.3-.9 1.6l-1.87.92-1.4 1.51c-.46.5-1.17.69-1.83.5l-1.99-.6-1.99.6c-.66.19-1.37 0-1.83-.5l-1.4-1.51-1.87-.92c-.62-.3-.98-.94-.9-1.6l.26-2.06-.76-1.94c-.24-.63-.1-1.35.36-1.85l1.4-1.51.36-2.05c.12-.66.64-1.18 1.3-1.3l2.05-.36 1.51-1.4c.42-.39 1-.55 1.57-.42zm3.13 7.36a.75.75 0 10-1.2-.9l-3.4 4.55-1.32-1.32a.75.75 0 10-1.06 1.06l1.94 1.94a.75.75 0 001.1-.08l3.94-5.25z"
          clipRule="evenodd"
        />
      </svg>
      {showLabel && <span className="font-medium">Doğrulanmış</span>}
    </span>
  )
}
