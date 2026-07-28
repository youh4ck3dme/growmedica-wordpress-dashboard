'use client'

import type { LucideIcon } from 'lucide-react'
import { Headphones, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import { m, useReducedMotion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { useT } from '@/components/i18n/LocaleProvider'
import type { TranslationKey } from '@/lib/i18n/translate'
import { cn } from '@/lib/utils'

interface TrustBadgeDef {
  titleKey: TranslationKey
  subtitleKey: TranslationKey
  icon: LucideIcon
}

const TRUST_BADGE_DEFS: TrustBadgeDef[] = [
  {
    titleKey: 'trust.badge1.title',
    subtitleKey: 'trust.badge1.subtitle',
    icon: ShieldCheck,
  },
  {
    titleKey: 'trust.badge2.title',
    subtitleKey: 'trust.badge2.subtitle',
    icon: Sparkles,
  },
  {
    titleKey: 'trust.badge3.title',
    subtitleKey: 'trust.badge3.subtitle',
    icon: TrendingUp,
  },
  {
    titleKey: 'trust.badge4.title',
    subtitleKey: 'trust.badge4.subtitle',
    icon: Headphones,
  },
]

export function TrustBadges() {
  const t = useT()
  const reduceMotion = useReducedMotion()

  return (
    <section className="usp-bar trust-badges theme-transition" aria-label={t('trust.aria')}>
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {TRUST_BADGE_DEFS.map((item) => {
            const Icon = item.icon
            const title = t(item.titleKey)

            return (
              <m.article
                key={item.titleKey}
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
                  {title}
                </p>
                <p className="text-xs text-(--color-text-muted)">{t(item.subtitleKey)}</p>
              </m.article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
