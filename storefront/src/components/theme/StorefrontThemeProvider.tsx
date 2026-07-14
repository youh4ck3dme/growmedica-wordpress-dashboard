'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  applyThemeToDocument,
  DEFAULT_THEME,
  getDocumentTheme,
  isLockedNoorDemo,
  readStoredTheme,
  setThemeCookie,
  STORAGE_KEY,
  THEME_CHANGED_EVENT,
  type StorefrontTheme,
} from '@/lib/theme/storefront-theme'
import { ThemeSwitchOverlay } from '@/components/theme/ThemeSwitchOverlay'

interface StorefrontThemeContextValue {
  theme: StorefrontTheme
  isSwitching: boolean
  pendingTheme: StorefrontTheme | null
  switchTheme: (next: StorefrontTheme) => void
}

const StorefrontThemeContext = createContext<StorefrontThemeContextValue | null>(null)

const THEME_APPLY_MS = 450
const OVERLAY_END_MS = 1100
const SAFETY_TIMEOUT_MS = 1500

function triggerRevealAnimation(): void {
  document.documentElement.classList.remove('theme-reveal-play')
  void document.documentElement.offsetWidth
  document.documentElement.classList.add('theme-reveal-play')
}

export function StorefrontThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<StorefrontTheme>(DEFAULT_THEME)
  const [isSwitching, setIsSwitching] = useState(false)
  const [pendingTheme, setPendingTheme] = useState<StorefrontTheme | null>(null)
  const timersRef = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  const finishSwitching = useCallback(() => {
    setIsSwitching(false)
    setPendingTheme(null)
  }, [])

  useEffect(() => {
    if (isLockedNoorDemo()) {
      const current = getDocumentTheme()
      if (current !== DEFAULT_THEME) {
        applyThemeToDocument(DEFAULT_THEME)
      }
      setTheme(DEFAULT_THEME)
      if (DEFAULT_THEME === 'noor') {
        requestAnimationFrame(() => {
          document.documentElement.classList.add('theme-reveal-play')
        })
      }
      return () => {
        clearTimers()
      }
    }

    const stored = readStoredTheme()
    const current = getDocumentTheme()

    if (stored && stored !== current) {
      applyThemeToDocument(stored)
      setThemeCookie(stored)
      setTheme(stored)
    } else {
      setTheme(current)
      if (stored) {
        setThemeCookie(stored)
      }
    }

    const resolved = stored && stored !== current ? stored : current
    if (resolved === 'noor') {
      requestAnimationFrame(() => {
        document.documentElement.classList.add('theme-reveal-play')
      })
    }

    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const switchTheme = useCallback(
    (next: StorefrontTheme) => {
      if (isLockedNoorDemo()) return
      if (next === theme || isSwitching) return

      clearTimers()
      setPendingTheme(next)
      setIsSwitching(true)

      const applyTimer = window.setTimeout(() => {
        applyThemeToDocument(next)

        try {
          localStorage.setItem(STORAGE_KEY, next)
          setThemeCookie(next)
        } catch {
          /* ignore quota / private mode */
        }

        setTheme(next)
        window.dispatchEvent(
          new CustomEvent(THEME_CHANGED_EVENT, { detail: { theme: next } }),
        )
        triggerRevealAnimation()
      }, THEME_APPLY_MS)

      const endTimer = window.setTimeout(() => {
        finishSwitching()
      }, OVERLAY_END_MS)

      const safetyTimer = window.setTimeout(() => {
        finishSwitching()
      }, SAFETY_TIMEOUT_MS)

      timersRef.current = [applyTimer, endTimer, safetyTimer]
    },
    [theme, isSwitching, clearTimers, finishSwitching],
  )

  return (
    <StorefrontThemeContext.Provider
      value={{ theme, isSwitching, pendingTheme, switchTheme }}
    >
      {children}
      <ThemeSwitchOverlay visible={isSwitching} pendingTheme={pendingTheme} />
    </StorefrontThemeContext.Provider>
  )
}

export function useStorefrontTheme(): StorefrontThemeContextValue {
  const context = useContext(StorefrontThemeContext)
  if (!context) {
    throw new Error('useStorefrontTheme must be used within StorefrontThemeProvider')
  }
  return context
}
