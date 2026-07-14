'use client'

import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { getAboutHealthLines, t } from '@/lib/i18n/translate'

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.25"
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
      <Container>
        <div className="why-growmedica__glass liquid-glass liquid-glass--heavy">
          <p className="why-growmedica__label">{t('about.label', locale)}</p>
          <h2 className="why-gm-display why-growmedica__heading">{t('about.heading', locale)}</h2>
          <p className="why-gm-display why-growmedica__slogan">{t('about.slogan', locale)}</p>
          <p className="why-growmedica__body">{t('about.body', locale)}</p>

          <ul className="why-growmedica__health-grid" aria-label={t('about.whyAria', locale)}>
            {healthLines.map((line) => (
              <li key={line} className="why-growmedica__health-line">
                <CheckIcon />
                {line}
              </li>
            ))}
          </ul>

          <div className="why-growmedica__actions">
            <Link href="/balicky" className="btn btn-primary">
              {t('about.bundlesCta', locale)}
            </Link>
            <Link href="/o-nas" className="btn btn-ghost">
              {t('about.moreAbout', locale)}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
