import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface BaseProps {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  /** Render as anchor instead of button. Pair with `href`. */
  asLink?: boolean
}

type ButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps>

type LinkProps = BaseProps & { asLink: true } &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps>

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50',
  secondary:
    'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-50',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 disabled:opacity-50',
  danger:
    'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
}

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'

function buildClassName(opts: {
  variant: Variant
  size: Size
  fullWidth: boolean
  extra?: string
}) {
  return [
    BASE_CLASSES,
    VARIANT_CLASSES[opts.variant],
    SIZE_CLASSES[opts.size],
    opts.fullWidth ? 'w-full' : '',
    opts.extra ?? '',
  ]
    .filter(Boolean)
    .join(' ')
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth = false, className, type, asLink, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={buildClassName({ variant, size, fullWidth, extra: className })}
      {...rest}
    />
  )
})

export const ButtonLink = forwardRef<HTMLAnchorElement, LinkProps>(function ButtonLink(
  { variant = 'primary', size = 'md', fullWidth = false, className, asLink: _asLink, ...rest },
  ref
) {
  return (
    <a
      ref={ref}
      className={buildClassName({ variant, size, fullWidth, extra: className })}
      {...rest}
    />
  )
})
