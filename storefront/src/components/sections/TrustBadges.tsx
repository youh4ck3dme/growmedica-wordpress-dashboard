'use client'

import type { LucideIcon } from 'lucide-react'
import { Headphones, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import { m, useReducedMotion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { cn } from '@/lib/utils'

interface TrustBadgeItem {
  title: string
  subtitle: string
  icon: LucideIcon
}

const TRUST_BADGES: TrustBadgeItem[] = [
  {
    title: 'DÔVERYHODNOSŤ',
    subtitle: 'Bezpečný nákup',
    icon: ShieldCheck,
  },
  {
    title: 'KVALITA',
    subtitle: 'Overené produkty',
    icon: Sparkles,
  },
  {
    title: 'RAST',
    subtitle: 'Rastúca značka v regióne',
    icon: TrendingUp,
  },
  {
    title: 'PODPORA',
    subtitle: 'Sme tu pre vás',
    icon: Headphones,
  },
]

export function TrustBadges() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="usp-bar trust-badges theme-transition" aria-label="Benefity">
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {TRUST_BADGES.map((item) => {
            const Icon = item.icon

            return (
              <m.article
                key={item.title}
                className={cn('trust-badge-glass theme-transition')}
                whileHover={reduceMotion ? undefined : { y: -4, scale: 1.02 }}
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 28,
                }}
              >
                <div className="trust-badge-glass__icon" aria-hidden="true">
                  <Icon className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <p
                  className="font-bold text-xs tracking-wide text-(--color-text)"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {item.title}
                </p>
                <p className="text-xs text-(--color-text-muted)">{item.subtitle}</p>
              </m.article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
