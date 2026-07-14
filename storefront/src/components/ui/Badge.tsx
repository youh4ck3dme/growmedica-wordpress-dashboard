import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'error' | 'warning' | 'brand' | 'muted'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'brand', className }: BadgeProps) {
  const variantClass = {
    success: 'badge-success',
    error: 'badge-error',
    warning: 'badge-warning',
    brand: 'badge-brand',
    muted: 'badge-muted',
  }[variant]

  return (
    <span className={cn('badge', variantClass, className)}>
      {children}
    </span>
  )
}
