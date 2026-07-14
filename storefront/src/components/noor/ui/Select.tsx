import { cn } from '@/lib/utils'
import type { SelectHTMLAttributes } from 'react'

interface NoorSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
}

export function NoorSelect({
  label,
  hint,
  error,
  className,
  id,
  children,
  ...props
}: NoorSelectProps) {
  const selectId = id ?? props.name

  return (
    <div className={cn('noor-field', className)}>
      {label ? (
        <label htmlFor={selectId} className="noor-field__label">
          {label}
        </label>
      ) : null}
      <select id={selectId} className={cn('noor-select', error && 'noor-input--error')} {...props}>
        {children}
      </select>
      {hint && !error ? <p className="noor-field__hint">{hint}</p> : null}
      {error ? <p className="noor-field__error">{error}</p> : null}
    </div>
  )
}
