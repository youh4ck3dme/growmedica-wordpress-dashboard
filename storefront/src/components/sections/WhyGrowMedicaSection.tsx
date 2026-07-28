'use client'

import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { getAboutHealthLines, t } from '@/lib/i18n/translate'

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <path
        d="M8 12.5l2.5 2.5L16 9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function WhyGrowMedicaSection() {
  const { locale } = useLocale()
  const healthLines = getAboutHealthLines(locale)

  return (
    <section className="why-growmedica noor-reveal theme-transition" aria-label={t('about.aria', locale)}>
      <div className="why-growmedica__atmosphere" aria-hidden="true" />
      <Container>
        <div className="why-growmedica__glass liquid-glass liquid-glass--heavy">
          <div className="why-growmedica__inner">
            <p className="why-growmedica__label why-growmedica__reveal" style={{ ['--why-delay' as string]: '0ms' }}>
              {t('about.label', locale)}
            </p>
            <h2
              className="why-gm-display why-growmedica__heading why-growmedica__reveal"
              style={{ ['--why-delay' as string]: '80ms' }}
            >
              {t('about.heading', locale)}
            </h2>
            <p
              className="why-gm-display why-growmedica__slogan why-growmedica__reveal"
              style={{ ['--why-delay' as string]: '140ms' }}
            >
              {t('about.slogan', locale)}
            </p>
            <p className="why-growmedica__body why-growmedica__reveal" style={{ ['--why-delay' as string]: '200ms' }}>
              {t('about.body', locale)}
            </p>

            <ul
              className="why-growmedica__health-grid why-growmedica__reveal"
              style={{ ['--why-delay' as string]: '280ms' }}
              aria-label={t('about.whyAria', locale)}
            >
              {healthLines.map((line) => (
                <li key={line} className="why-growmedica__health-line">
                  <span className="why-growmedica__health-icon">
                    <CheckIcon />
                  </span>
                  <span className="why-growmedica__health-text">{line}</span>
                </li>
              ))}
            </ul>

            <div
              className="why-growmedica__actions why-growmedica__reveal"
              style={{ ['--why-delay' as string]: '360ms' }}
            >
              <Link href="/balicky" className="btn btn-primary">
                {t('about.bundlesCta', locale)}
              </Link>
              <Link href="/o-nas" className="btn btn-ghost">
                {t('about.moreAbout', locale)}
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
