'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { SUPPORTED_LOCALES, type Locale } from '@/lib/i18n/types'
import { useLocale } from '@/components/i18n/LocaleProvider'

const LOCALE_LABELS: Record<Locale, string> = {
  sk: 'SK',
  en: 'EN',
  de: 'DE',
}

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, t } = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function buildHref(nextLocale: Locale): string {
    const params = new URLSearchParams(searchParams.toString())
    params.set('lang', nextLocale)
    const query = params.toString()
    return query ? `${pathname}?${query}` : `${pathname}?lang=${nextLocale}`
  }

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-lg border border-(--color-border) bg-(--color-surface)/80 p-0.5 ${className}`.trim()}
      data-testid="locale-switcher"
      role="group"
      aria-label={t('locale.switcher')}
    >
      {SUPPORTED_LOCALES.map((code) => (
        <a
          key={code}
          href={buildHref(code)}
          className={`rounded-md px-2 py-1 text-[10px] font-bold tracking-wider transition-colors ${
            locale === code
              ? 'bg-(--color-primary) text-white'
              : 'text-(--color-text-muted) hover:text-(--color-text)'
          }`}
          aria-current={locale === code ? 'true' : undefined}
          data-testid={`locale-switcher-${code}`}
        >
          {LOCALE_LABELS[code]}
        </a>
      ))}
    </div>
  )
}
