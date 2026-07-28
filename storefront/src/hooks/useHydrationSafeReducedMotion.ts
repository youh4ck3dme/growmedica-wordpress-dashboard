'use client'

import { useEffect, useState } from 'react'

/**
 * Hydration-safe prefers-reduced-motion without Framer Motion's console warning.
 * SSR + first client paint always return false; after mount mirrors matchMedia.
 */
export function useHydrationSafeReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(media.matches)
    sync()

    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return reduceMotion
}
