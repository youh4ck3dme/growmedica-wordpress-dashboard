import type { Locale } from './types'
import sk from './locales/sk.json'
import en from './locales/en.json'
import de from './locales/de.json'

const messages = { sk, en, de } as const

export type TranslationKey = keyof typeof sk

export function t(
  key: TranslationKey,
  locale: Locale,
  vars?: Record<string, string | number>,
): string {
  const table = messages[locale] ?? messages.sk
  let value = table[key] ?? messages.sk[key] ?? key

  if (vars) {
    for (const [name, val] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, String(val))
    }
  }

  return value
}

export function createTranslator(locale: Locale) {
  return (key: TranslationKey, vars?: Record<string, string | number>) => t(key, locale, vars)
}

export function getAboutHealthLines(locale: Locale): string[] {
  return [
    t('about.health1', locale),
    t('about.health2', locale),
    t('about.health3', locale),
    t('about.health4', locale),
    t('about.health5', locale),
  ]
}

export function getTrustStripStats(locale: Locale): string[] {
  return [t('trust.stat1', locale), t('trust.stat2', locale), t('trust.stat3', locale)]
}

export function getFooterInfoLinks(locale: Locale): Array<{ href: string; label: string }> {
  return [
    { href: '/obchodne-podmienky', label: t('footer.infoTerms', locale) },
    { href: '/reklamacny-poriadok', label: t('footer.infoReturns', locale) },
    { href: '/kontakt', label: t('footer.infoContact', locale) },
    { href: '/ochrana-osobnych-udajov', label: t('footer.infoPrivacy', locale) },
    { href: '/doprava-a-platba', label: t('footer.infoShipping', locale) },
    { href: '/faq', label: t('footer.infoFaq', locale) },
    { href: '/velkoobchod', label: t('footer.infoWholesale', locale) },
  ]
}

export function getProductShippingLines(locale: Locale): string[] {
  return [
    t('product.shipping1', locale),
    t('product.shipping2', locale),
    t('product.shipping3', locale),
  ]
}

export function getFaqItems(locale: Locale): Array<{ q: string; a: string }> {
  return [
    { q: t('faq.delivery.q', locale), a: t('faq.delivery.a', locale) },
    { q: t('faq.pickup.q', locale), a: t('faq.pickup.a', locale) },
    { q: t('faq.vegan.q', locale), a: t('faq.vegan.a', locale) },
    { q: t('faq.claim.q', locale), a: t('faq.claim.a', locale) },
  ]
}
