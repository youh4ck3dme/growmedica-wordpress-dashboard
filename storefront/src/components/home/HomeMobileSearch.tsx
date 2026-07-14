'use client'

import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { useT } from '@/components/i18n/LocaleProvider'

export function HomeMobileSearch() {
  const t = useT()

  return (
    <div className="theme-transition noor-reveal noor-mobile-search border-b border-(--color-border) bg-(--color-surface) py-3 lg:hidden">
      <Container>
        <Link href="/vyhladavanie" className="search-pill no-underline" aria-label={t('home.searchAria')}>
          <svg className="h-5 w-5 shrink-0 text-(--color-primary)" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>{t('home.searchPlaceholder')}</span>
        </Link>
      </Container>
    </div>
  )
}
