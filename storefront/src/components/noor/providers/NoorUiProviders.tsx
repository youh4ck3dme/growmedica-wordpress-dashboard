'use client'

import type { ReactNode } from 'react'
import { useStorefrontTheme } from '@/components/theme/StorefrontThemeProvider'
import { ToastProvider, SearchDrawerProvider } from '@/components/noor/ui'

export function NoorUiProviders({ children }: { children: ReactNode }) {
  const { theme } = useStorefrontTheme()
  const isNoor = theme === 'noor'

  if (!isNoor) {
    return <ToastProvider>{children}</ToastProvider>
  }

  return (
    <ToastProvider>
      <SearchDrawerProvider>{children}</SearchDrawerProvider>
    </ToastProvider>
  )
}
