import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { buildPageMetadata } from '@/lib/seo'
import { getRequestLocale } from '@/lib/i18n/server'
import { t } from '@/lib/i18n/translate'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'

export async function generateMetadata(): Promise<Metadata> {
  const locale = DEFAULT_LOCALE
  return buildPageMetadata(
    t('page.about.metaTitle', locale),
    t('page.about.metaDescription', locale),
    '/o-nas',
  )
}

export default async function AboutPage() {
  const locale = await getRequestLocale()

  return (
    <div className="py-12 lg:py-20 bg-(--color-bg)">
      <Container>
        <div className="max-w-3xl mx-auto">
          <BrandPageHeader
            eyebrow={t('page.about.eyebrow', locale)}
            title={t('page.about.title', locale)}
            subtitle={t('page.about.intro', locale)}
          />

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-(--shadow-card) border border-(--color-border)">
            <h2 className="text-2xl font-bold text-(--color-primary) mb-4 font-montserrat">
              {t('page.about.missionHeading', locale)}
            </h2>
            <p className="text-(--color-text-muted) mb-6 leading-relaxed">
              {t('page.about.missionBody', locale)}
            </p>

            <h2 className="text-2xl font-bold text-(--color-primary) mb-4 font-montserrat mt-10">
              {t('page.about.whyHeading', locale)}
            </h2>
            <ul className="space-y-4 text-(--color-text-muted) mb-8">
              <li className="flex items-start">
                <span className="text-(--color-accent-green) font-bold mr-3 text-lg">✓</span>
                <span>
                  <strong className="text-(--color-text)">{t('page.about.qualityTitle', locale)}</strong>{' '}
                  {t('page.about.qualityBody', locale)}
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-(--color-accent-green) font-bold mr-3 text-lg">✓</span>
                <span>
                  <strong className="text-(--color-text)">{t('page.about.scienceTitle', locale)}</strong>{' '}
                  {t('page.about.scienceBody', locale)}
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-(--color-accent-green) font-bold mr-3 text-lg">✓</span>
                <span>
                  <strong className="text-(--color-text)">{t('page.about.transparencyTitle', locale)}</strong>{' '}
                  {t('page.about.transparencyBody', locale)}
                </span>
              </li>
            </ul>

            <div className="bg-(--color-surface-2) rounded-xl p-6 md:p-8 border-l-4 border-(--color-accent-green) my-10">
              <p className="italic text-(--color-text) font-medium text-lg">
                {t('page.about.quote', locale)}
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-(--color-border) text-center">
              <h3 className="text-xl font-bold text-(--color-primary) mb-5 font-montserrat">
                {t('page.about.ctaHeading', locale)}
              </h3>
              <Link href="/produkty" className="btn btn-primary btn-lg">
                {t('page.about.cta', locale)}
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
