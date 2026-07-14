'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { getTrustStripStats, t } from '@/lib/i18n/translate'

export default function TrustStrip() {
  const pathname = usePathname()
  const { locale } = useLocale()

  if (pathname === '/') {
    return null
  }

  const stats = getTrustStripStats(locale)

  return (
    <div className="trust-strip" role="region" aria-label={t('aria.aboutBrand', locale)}>
      <Container>
        <div className="trust-strip-inner">
          <p className="trust-strip-tagline">{t('trust.tagline', locale)}</p>
          <div className="trust-strip-stats" aria-hidden="true">
            {stats.map((stat) => (
              <span key={stat} className="trust-strip-stat">
                {stat}
              </span>
            ))}
          </div>
          <Link href="/o-nas" className="trust-strip-link">
            {t('trust.aboutLink', locale)}
          </Link>
        </div>
      </Container>
    </div>
  )
}
