'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useStorefrontTheme } from '@/components/theme/StorefrontThemeProvider'
import type { StorefrontTheme } from '@/lib/theme/storefront-theme'
import { cn } from '@/lib/utils'

const OPTIONS: { value: StorefrontTheme; label: string }[] = [
  { value: 'classic', label: 'Classic' },
  { value: 'noor', label: 'NOOR' },
]

function ClassicThemeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.05 5.05l1.55 1.55M17.4 17.4l1.55 1.55M18.95 5.05l-1.55 1.55M6.6 17.4l-1.55 1.55"
      />
    </svg>
  )
}

function NoorThemeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"
      />
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M15.2 4.2l.35 1.1 1.1.35-1.1.35-.35 1.1-.35-1.1-1.1-.35 1.1-.35.35-1.1Z"
      />
    </svg>
  )
}

const THEME_ICONS: Record<StorefrontTheme, (props: { className?: string }) => ReactNode> = {
  classic: ClassicThemeIcon,
  noor: NoorThemeIcon,
}

interface StorefrontThemeSwitcherProps {
  compact?: boolean
  className?: string
}

export function StorefrontThemeSwitcher({
  compact = false,
  className,
}: StorefrontThemeSwitcherProps) {
  const { theme, isSwitching, switchTheme } = useStorefrontTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const CurrentIcon = THEME_ICONS[theme]
  const currentLabel = OPTIONS.find((option) => option.value === theme)?.label ?? theme

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (isSwitching) setOpen(false)
  }, [isSwitching])

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative shrink-0',
        compact ? 'inline-flex sm:hidden' : 'hidden sm:inline-flex mr-1',
        className,
      )}
      data-testid="theme-switcher"
    >
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-border) bg-(--color-surface)/80 px-2 py-1 text-[10px] font-bold tracking-wider text-(--color-text) transition-colors hover:border-(--color-primary)/40 disabled:opacity-50"
        aria-label="Prepínač vzhľadu"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        data-testid="theme-switcher-trigger"
        disabled={isSwitching}
        onClick={() => setOpen((prev) => !prev)}
      >
        <CurrentIcon className="h-3.5 w-3.5 text-(--color-primary)" />
        <span data-testid="theme-switcher-current">{currentLabel}</span>
        <svg
          className={cn(
            'h-3 w-3 text-(--color-text-muted) transition-transform',
            open && 'rotate-180',
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        id={listId}
        role="listbox"
        aria-label="Prepínač vzhľadu"
        hidden={!open}
        className="absolute right-0 top-full z-50 mt-1 min-w-[7.5rem] overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) py-0.5 shadow-sm"
      >
        {OPTIONS.map((option) => {
          const active = theme === option.value
          const Icon = THEME_ICONS[option.value]

          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={active}
              disabled={isSwitching || active}
              data-testid={`theme-switcher-${option.value}`}
              className={cn(
                'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[10px] font-bold tracking-wider transition-colors',
                active
                  ? 'bg-(--color-primary) text-white'
                  : 'text-(--color-text-muted) hover:bg-(--color-surface-2) hover:text-(--color-text)',
                (isSwitching || active) && 'cursor-default',
              )}
              onClick={() => {
                setOpen(false)
                if (!active) switchTheme(option.value)
              }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
