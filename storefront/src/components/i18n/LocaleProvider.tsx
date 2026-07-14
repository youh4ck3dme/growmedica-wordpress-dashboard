'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Locale } from '@/lib/i18n/types'
import { createTranslator, type TranslationKey } from '@/lib/i18n/translate'

type LocaleContextValue = {
  locale: Locale
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

type LocaleProviderProps = {
  locale: Locale
  children: ReactNode
}

export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  const value = useMemo(
    () => ({
      locale,
      t: createTranslator(locale),
    }),
    [locale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return ctx
}

export function useT() {
  return useLocale().t
}
