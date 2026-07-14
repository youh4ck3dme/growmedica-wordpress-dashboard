import { cn } from '@/lib/utils'
import type { TextareaHTMLAttributes } from 'react'

interface NoorTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export function NoorTextarea({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: NoorTextareaProps) {
  const textareaId = id ?? props.name

  return (
    <div className={cn('noor-field', className)}>
      {label ? (
        <label htmlFor={textareaId} className="noor-field__label">
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        className={cn('noor-textarea', error && 'noor-input--error')}
        {...props}
      />
      {hint && !error ? <p className="noor-field__hint">{hint}</p> : null}
      {error ? <p className="noor-field__error">{error}</p> : null}
    </div>
  )
}
