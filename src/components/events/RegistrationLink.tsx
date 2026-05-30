'use client'

interface Props {
  url: string
}

/**
 * Client Component — onClick'in RSC payload'a serialize edilmesini önler.
 * EventCard (Server Component) içinde RegistrationLink kullanılır.
 *
 * stopPropagation: Üst <Link> bileşeninin onClick'ini tetiklememek için.
 */
export function RegistrationLink({ url }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="mt-2 w-full text-center py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition-colors"
    >
      Kayıt Ol →
    </a>
  )
}
