import { DEFAULT_LOCALE } from './config'
import type { Locale, LocaleInput } from './types'
import { SUPPORTED_LOCALES } from './types'

export function isValidLocale(value: string | null | undefined): value is Locale {
  return value === 'sk' || value === 'en' || value === 'de'
}

function localeFromCountry(country: string | null | undefined): Locale | null {
  if (!country) return null
  const code = country.trim().toUpperCase()
  if (code === 'SK' || code === 'CZ') return 'sk'
  if (code === 'DE' || code === 'AT' || code === 'CH') return 'de'
  return 'en'
}

function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null
  const lower = header.toLowerCase()
  if (/\bsk\b/.test(lower) || lower.startsWith('sk')) return 'sk'
  if (/\bde\b/.test(lower) || lower.startsWith('de')) return 'de'
  return 'en'
}

export function resolveLocaleFromInput(input: LocaleInput): Locale {
  if (input.queryLang && isValidLocale(input.queryLang)) {
    return input.queryLang
  }

  if (input.cookieLocale && isValidLocale(input.cookieLocale)) {
    return input.cookieLocale
  }

  const fromCountry = localeFromCountry(input.country)
  if (fromCountry) return fromCountry

  const fromAccept = localeFromAcceptLanguage(input.acceptLanguage)
  if (fromAccept) return fromAccept

  return input.defaultLocale ?? DEFAULT_LOCALE
}

export function resolveLocaleFromRequestLike(input: {
  cookies?: { get: (name: string) => { value: string } | undefined }
  headers?: { get: (name: string) => string | null }
  nextUrl?: { searchParams: { get: (key: string) => string | null } }
}): Locale {
  const queryLang = input.nextUrl?.searchParams.get('lang') ?? null
  const cookieLocale = input.cookies?.get('growmedica_locale')?.value ?? null
  const country = input.headers?.get('x-vercel-ip-country') ?? null
  const acceptLanguage = input.headers?.get('accept-language') ?? null

  return resolveLocaleFromInput({
    queryLang,
    cookieLocale,
    country,
    acceptLanguage,
  })
}

export { SUPPORTED_LOCALES }
