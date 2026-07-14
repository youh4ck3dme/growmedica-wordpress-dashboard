'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import type { StorefrontTheme } from '@/lib/theme/storefront-theme'

interface ThemeSwitchOverlayProps {
  visible: boolean
  pendingTheme: StorefrontTheme | null
}

export function ThemeSwitchOverlay({ visible, pendingTheme }: ThemeSwitchOverlayProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !visible || !pendingTheme) return null

  const message =
    pendingTheme === 'noor'
      ? 'Načítavam NOOR vzhľad…'
      : 'Obnovujem Classic vzhľad…'

  return createPortal(
    <div
      className="theme-switch-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="theme-switch-overlay__panel">
        <div className="theme-switch-overlay__spinner" aria-hidden="true" />
        <p className="theme-switch-overlay__text">{message}</p>
      </div>
    </div>,
    document.body,
  )
}
