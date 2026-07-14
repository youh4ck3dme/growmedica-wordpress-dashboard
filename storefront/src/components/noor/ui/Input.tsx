import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

interface NoorInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export function NoorInput({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: NoorInputProps) {
  const inputId = id ?? props.name

  return (
    <div className={cn('noor-field', className)}>
      {label ? (
        <label htmlFor={inputId} className="noor-field__label">
          {label}
        </label>
      ) : null}
      <input id={inputId} className={cn('noor-input', error && 'noor-input--error')} {...props} />
      {hint && !error ? <p className="noor-field__hint">{hint}</p> : null}
      {error ? <p className="noor-field__error">{error}</p> : null}
    </div>
  )
}
