import type { Locale } from './types'

export const DEFAULT_LOCALE: Locale = (() => {
  const raw = process.env.NEXT_PUBLIC_DEFAULT_LOCALE?.trim().toLowerCase()
  if (raw === 'cs' || raw === 'sk' || raw === 'en' || raw === 'de') return raw
  return 'cs'
})()

export const OG_LOCALE_MAP: Record<Locale, string> = {
  cs: 'cs_CZ',
  sk: 'sk_SK',
  en: 'en_US',
  de: 'de_DE',
}

export const HREFLANG_MAP: Record<Locale, string> = {
  cs: 'cs-CZ',
  sk: 'sk-SK',
  en: 'en',
  de: 'de-DE',
}
