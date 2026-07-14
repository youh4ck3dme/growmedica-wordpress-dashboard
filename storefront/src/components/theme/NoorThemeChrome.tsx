'use client'

import { useStorefrontTheme } from '@/components/theme/StorefrontThemeProvider'
import { NoorScrollProgress } from '@/components/theme/NoorScrollProgress'
import { NoorScrollToTop } from '@/components/theme/NoorScrollToTop'

export function NoorThemeChrome() {
  const { theme } = useStorefrontTheme()

  if (theme !== 'noor') return null

  return (
    <>
      <NoorScrollProgress />
      <NoorScrollToTop />
    </>
  )
}
