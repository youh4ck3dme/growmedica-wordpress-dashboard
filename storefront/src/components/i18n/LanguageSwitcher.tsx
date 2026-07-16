'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { SUPPORTED_LOCALES, type Locale } from '@/lib/i18n/types'
import { useLocale } from '@/components/i18n/LocaleProvider'

const LOCALE_LABELS: Record<Locale, string> = {
  cs: 'CS',
  sk: 'SK',
  en: 'EN',
  de: 'DE',
}

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, t } = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  function buildHref(nextLocale: Locale): string {
    const params = new URLSearchParams(searchParams.toString())
    params.set('lang', nextLocale)
    const query = params.toString()
    return query ? `${pathname}?${query}` : `${pathname}?lang=${nextLocale}`
  }

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

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex ${className}`.trim()}
      data-testid="locale-switcher"
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg border border-(--color-border) bg-(--color-surface)/80 px-2 py-1 text-[10px] font-bold tracking-wider text-(--color-text) transition-colors hover:border-(--color-primary)/40"
        aria-label={t('locale.switcher')}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        data-testid="locale-switcher-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span data-testid={`locale-switcher-current`}>{LOCALE_LABELS[locale]}</span>
        <svg
          className={`h-3 w-3 text-(--color-text-muted) transition-transform ${open ? 'rotate-180' : ''}`}
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
        aria-label={t('locale.switcher')}
        hidden={!open}
        className="absolute right-0 top-full z-50 mt-1 min-w-full overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) py-0.5 shadow-sm"
      >
        {SUPPORTED_LOCALES.map((code) => (
          <a
            key={code}
            href={buildHref(code)}
            role="option"
            aria-selected={locale === code}
            className={`block px-2.5 py-1.5 text-center text-[10px] font-bold tracking-wider transition-colors ${
              locale === code
                ? 'bg-(--color-primary) text-white'
                : 'text-(--color-text-muted) hover:bg-(--color-surface-2) hover:text-(--color-text)'
            }`}
            data-testid={`locale-switcher-${code}`}
            onClick={() => setOpen(false)}
          >
            {LOCALE_LABELS[code]}
          </a>
        ))}
      </div>
    </div>
  )
}
