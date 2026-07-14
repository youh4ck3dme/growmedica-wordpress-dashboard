import type { Locale } from '@/lib/i18n/types'
import { t, type TranslationKey } from '@/lib/i18n/translate'

export interface NavLinkItem {
  href: string
  label: string
}

/** Primary header / mobile drawer links — same order everywhere. */
export function getPrimaryNavLinks(locale: Locale): NavLinkItem[] {
  return [
    { href: '/kolekcie', label: t('nav.collections', locale) },
    { href: '/balicky', label: t('nav.bundles', locale) },
    { href: '/produkty', label: t('nav.products', locale) },
    { href: '/o-nas', label: t('nav.about', locale) },
    { href: '/vyhladavanie', label: t('nav.search', locale) },
  ]
}

/** @deprecated Use getPrimaryNavLinks(locale) — kept for static test imports */
export const PRIMARY_NAV_LINKS: NavLinkItem[] = getPrimaryNavLinks('sk')
