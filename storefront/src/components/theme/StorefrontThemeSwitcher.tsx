'use client'

import { useStorefrontTheme } from '@/components/theme/StorefrontThemeProvider'
import type { StorefrontTheme } from '@/lib/theme/storefront-theme'
import { cn } from '@/lib/utils'

const OPTIONS: { value: StorefrontTheme; label: string }[] = [
  { value: 'classic', label: 'Classic' },
  { value: 'noor', label: 'NOOR' },
]

interface StorefrontThemeSwitcherProps {
  compact?: boolean
  className?: string
}

export function StorefrontThemeSwitcher({
  compact = false,
  className,
}: StorefrontThemeSwitcherProps) {
  const { theme, isSwitching, switchTheme } = useStorefrontTheme()

  return (
    <div
      className={cn(
        'noor-theme-switch shrink-0',
        compact ? 'inline-flex sm:hidden w-full' : 'hidden sm:inline-flex mr-1',
        className,
      )}
      role="group"
      aria-label="Prepínač vzhľadu"
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value

        return (
          <button
            key={option.value}
            type="button"
            className={cn('noor-theme-switch__btn', active && 'noor-theme-switch__btn--active')}
            aria-pressed={active}
            disabled={isSwitching}
            onClick={() => switchTheme(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
