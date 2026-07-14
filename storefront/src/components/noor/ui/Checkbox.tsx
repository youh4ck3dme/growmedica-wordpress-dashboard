import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

interface NoorCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function NoorCheckbox({ label, className, id, ...props }: NoorCheckboxProps) {
  const checkboxId = id ?? props.name

  return (
    <label htmlFor={checkboxId} className={cn('noor-checkbox', className)}>
      <input id={checkboxId} type="checkbox" className="noor-checkbox__input" {...props} />
      <span className="noor-checkbox__label">{label}</span>
    </label>
  )
}
