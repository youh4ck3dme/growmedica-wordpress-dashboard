'use client'

import type { InputHTMLAttributes } from 'react'
import { useStorefrontTheme } from '@/components/theme/StorefrontThemeProvider'
import { NoorInput } from '@/components/noor/ui/Input'
import { cn } from '@/lib/utils'

interface ThemeInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export function ThemeInput({ className, label, hint, error, ...props }: ThemeInputProps) {
  const { theme } = useStorefrontTheme()

  if (theme === 'noor') {
    return <NoorInput label={label} hint={hint} error={error} className={className} {...props} />
  }

  return (
    <input
      className={cn(
        'w-full px-4 py-2.5 rounded-lg border border-(--color-border) text-(--color-text) bg-white focus:outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary) transition-colors',
        className,
      )}
      {...props}
    />
  )
}
