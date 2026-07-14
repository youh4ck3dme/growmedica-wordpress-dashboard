'use client'

import type { ReactNode } from 'react'
import { m, useReducedMotion } from 'framer-motion'

const REVEAL_EASE = [0.22, 1, 0.36, 1] as const

export const SCROLL_REVEAL_VIEWPORT = {
  once: true,
  margin: '-100px',
} as const

interface ScrollRevealSectionProps {
  children: ReactNode
  className?: string
  as?: 'section' | 'div'
  id?: string
  'aria-labelledby'?: string
  'aria-label'?: string
}

export function ScrollRevealSection({
  children,
  className,
  as = 'div',
  id,
  'aria-labelledby': ariaLabelledby,
  'aria-label': ariaLabel,
}: ScrollRevealSectionProps) {
  const reduceMotion = useReducedMotion()
  const motionProps = {
    className,
    id,
    'aria-labelledby': ariaLabelledby,
    'aria-label': ariaLabel,
    initial: reduceMotion ? false : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: SCROLL_REVEAL_VIEWPORT,
    transition: {
      duration: reduceMotion ? 0 : 0.65,
      ease: REVEAL_EASE,
    },
  }

  if (as === 'section') {
    return <m.section {...motionProps}>{children}</m.section>
  }

  return <m.div {...motionProps}>{children}</m.div>
}
