'use client'

import { useStorefrontTheme } from '@/components/theme/StorefrontThemeProvider'
import { useToast as useNoorToast } from '@/components/noor/ui/Toast'

interface ToastPayload {
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error'
}

export function useThemeToast() {
  const { theme } = useStorefrontTheme()
  const noorToast = useNoorToast()

  function toast(payload: ToastPayload) {
    noorToast.toast(payload)
  }

  return {
    toast,
    isNoor: theme === 'noor',
  }
}
