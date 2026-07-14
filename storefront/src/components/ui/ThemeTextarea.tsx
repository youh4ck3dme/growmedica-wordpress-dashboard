'use client'

import type { TextareaHTMLAttributes } from 'react'
import { useStorefrontTheme } from '@/components/theme/StorefrontThemeProvider'
import { NoorTextarea } from '@/components/noor/ui/Textarea'
import { cn } from '@/lib/utils'

interface ThemeTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export function ThemeTextarea({ className, label, hint, error, ...props }: ThemeTextareaProps) {
  const { theme } = useStorefrontTheme()

  if (theme === 'noor') {
    return (
      <NoorTextarea label={label} hint={hint} error={error} className={className} {...props} />
    )
  }

  return (
    <textarea
      className={cn(
        'w-full px-4 py-3 rounded-lg border border-(--color-border) text-(--color-text) bg-white focus:outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary) transition-colors',
        className,
      )}
      {...props}
    />
  )
}
