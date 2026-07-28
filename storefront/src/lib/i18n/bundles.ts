import type { HealthBundle } from '@/lib/bundles/catalog'
import type { Locale } from '@/lib/i18n/types'
import { t, type TranslationKey } from '@/lib/i18n/translate'

function keyOrFallback(key: string, locale: Locale, fallback: string): string {
  const value = t(key as TranslationKey, locale)
  return value === key ? fallback : value
}

export function getBundleName(slug: string, locale: Locale, fallbackName: string): string {
  return keyOrFallback(`bundle.name.${slug}`, locale, fallbackName)
}

export function getBundleCategoryLabel(
  category: HealthBundle['category'],
  locale: Locale,
  fallback: string,
): string {
  return keyOrFallback(`bundle.cat.${category}`, locale, fallback)
}

export function getBundleCategoryBenefit(
  category: HealthBundle['category'],
  locale: Locale,
  fallback: string,
): string {
  return keyOrFallback(`bundle.benefit.${category}`, locale, fallback)
}

export function getBundleDisclaimer(
  bundle: HealthBundle,
  locale: Locale,
): string | undefined {
  if (!bundle.disclaimer) return undefined
  if (bundle.slug === 'tehotenstvo-prep') {
    return keyOrFallback('bundle.disclaimer.pregnancy', locale, bundle.disclaimer)
  }
  return bundle.disclaimer
}
