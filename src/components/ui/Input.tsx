import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  /** Error mesajı — varsa border kırmızı + altta mesaj */
  error?: string
  /** İpucu — error yoksa altta gri metin */
  hint?: string
}

const BASE_INPUT_CLASSES =
  'w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 text-sm transition-colors'
const NORMAL_BORDER = 'border-gray-200 focus:ring-indigo-500'
const ERROR_BORDER = 'border-red-300 focus:ring-red-500'
const DISABLED = 'bg-gray-50 text-gray-400 cursor-not-allowed'

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, disabled, ...rest },
  ref
) {
  const reactId = useId()
  const inputId = id ?? reactId

  const inputClasses = [
    BASE_INPUT_CLASSES,
    error ? ERROR_BORDER : NORMAL_BORDER,
    disabled ? DISABLED : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        className={inputClasses}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-gray-400">
          {hint}
        </p>
      ) : null}
    </div>
  )
})
