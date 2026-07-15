import { test, expect } from '@playwright/test'
import {
  isValidLocale,
  resolveLocaleFromInput,
} from '../../src/lib/i18n'

test.describe('i18n locale detection', () => {
  test('resolveLocaleFromInput maps countries', () => {
    expect(resolveLocaleFromInput({ country: 'SK' })).toBe('sk')
    expect(resolveLocaleFromInput({ country: 'CZ' })).toBe('sk')
    expect(resolveLocaleFromInput({ country: 'DE' })).toBe('de')
    expect(resolveLocaleFromInput({ country: 'AT' })).toBe('de')
    expect(resolveLocaleFromInput({ country: 'CH' })).toBe('de')
    expect(resolveLocaleFromInput({ country: 'US' })).toBe('en')
  })

  test('resolveLocaleFromInput respects cookie over geo', () => {
    expect(
      resolveLocaleFromInput({ cookieLocale: 'sk', country: 'DE' }),
    ).toBe('sk')
  })

  test('resolveLocaleFromInput uses Accept-Language fallback', () => {
    expect(resolveLocaleFromInput({ acceptLanguage: 'de-DE,de;q=0.9' })).toBe('de')
    expect(resolveLocaleFromInput({ acceptLanguage: 'sk-SK,sk;q=0.9' })).toBe('sk')
    expect(resolveLocaleFromInput({ acceptLanguage: 'fr-FR,fr;q=0.9' })).toBe('en')
  })

  test('resolveLocaleFromInput defaults to de', () => {
    expect(resolveLocaleFromInput({ defaultLocale: 'de' })).toBe('de')
  })

  test('isValidLocale validates supported locales', () => {
    expect(isValidLocale('sk')).toBe(true)
    expect(isValidLocale('en')).toBe(true)
    expect(isValidLocale('de')).toBe(true)
    expect(isValidLocale('fr')).toBe(false)
  })
})
