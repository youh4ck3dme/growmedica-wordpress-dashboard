'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { getCollectionUrl } from '@/lib/utils'
import { t, type TranslationKey } from '@/lib/i18n/translate'

const COMPASS_INTENTS = [
  { handle: 'imunita', labelKey: 'trust.compass.intent1Label' as const },
  { handle: 'sportova-vyziva', labelKey: 'trust.compass.intent2Label' as const },
  { handle: 'spanok-stres', labelKey: 'trust.compass.intent3Label' as const },
] as const

function resolveLeadKey(pathname: string | null): TranslationKey {
  if (!pathname) return 'trust.compass.leadDefault'
  if (pathname === '/kolekcie' || pathname.startsWith('/kolekcie/')) {
    return 'trust.compass.leadCollections'
  }
  if (pathname === '/produkty' || pathname.startsWith('/produkty/')) {
    return 'trust.compass.leadProducts'
  }
  return 'trust.compass.leadDefault'
}

export default function TrustStrip() {
  const pathname = usePathname()
  const { locale } = useLocale()

  if (pathname === '/') {
    return null
  }

  const leadKey = resolveLeadKey(pathname)

  return (
    <div className="trust-strip" role="region" aria-label={t('aria.aboutBrand', locale)}>
      <Container>
        <div className="trust-strip-inner">
          <p className="trust-strip-lead">{t(leadKey, locale)}</p>

          <nav className="trust-strip-intents" aria-label={t('trust.compass.navLabel', locale)}>
            {COMPASS_INTENTS.map((intent) => (
              <Link
                key={intent.handle}
                href={getCollectionUrl(intent.handle)}
                className="trust-strip-intent"
              >
                {t(intent.labelKey, locale)}
              </Link>
            ))}
          </nav>

          <Link href="/#supplement-finder" className="trust-strip-link">
            {t('trust.compass.cta', locale)}
          </Link>
        </div>
      </Container>
    </div>
  )
}
