export type Locale = 'cs' | 'sk' | 'en' | 'de'

export const SUPPORTED_LOCALES: Locale[] = ['cs', 'sk', 'en', 'de']

export const LOCALE_COOKIE = 'growmedica_locale'
export const LOCALE_HEADER = 'x-growmedica-locale'
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export type LocaleInput = {
  queryLang?: string | null
  cookieLocale?: string | null
  country?: string | null
  acceptLanguage?: string | null
  defaultLocale?: Locale
}
