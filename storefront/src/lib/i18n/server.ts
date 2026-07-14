import { cookies, headers } from 'next/headers'
import { isValidLocale, resolveLocaleFromInput } from './detect'
import { DEFAULT_LOCALE } from './config'
import { LOCALE_COOKIE, LOCALE_HEADER, type Locale } from './types'

export async function getRequestLocale(): Promise<Locale> {
  const headersList = await headers()
  const headerLocale = headersList.get(LOCALE_HEADER)
  if (isValidLocale(headerLocale)) return headerLocale

  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value

  return resolveLocaleFromInput({
    cookieLocale,
    country: headersList.get('x-vercel-ip-country'),
    acceptLanguage: headersList.get('accept-language'),
    defaultLocale: DEFAULT_LOCALE,
  })
}
