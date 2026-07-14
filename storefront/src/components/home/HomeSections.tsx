'use client'

import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { t } from '@/lib/i18n/translate'

export function HomeFeaturedSection({
  children,
}: {
  children: React.ReactNode
}) {
  const { locale } = useLocale()

  return (
    <section
      className="noor-reveal noor-featured-section theme-transition py-12 lg:py-16 bg-(--color-surface-2)"
      aria-labelledby="featured-heading"
    >
      <Container>
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-label">{t('home.featuredLabel', locale)}</p>
            <h2 id="featured-heading" className="section-heading noor-display-heading">
              {t('home.featuredHeading', locale)}
            </h2>
          </div>
          <Link
            href="/produkty"
            className="text-sm font-semibold hidden sm:block transition-colors text-(--color-primary) hover:text-(--color-primary-dark)"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
            aria-label={t('home.viewAllFeaturedAria', locale)}
          >
            {t('home.viewAllFeatured', locale)}
          </Link>
        </div>

        <div className="noor-stagger noor-featured-rail">{children}</div>
        <div className="noor-carousel-track mt-4 lg:hidden" aria-hidden="true">
          <div className="noor-carousel-track__fill" />
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/produkty" className="btn btn-primary" aria-label={t('home.viewAllProductsAria', locale)}>
            {t('home.viewAllProducts', locale)}
          </Link>
        </div>
      </Container>
    </section>
  )
}

export function HomeCategoriesSection({
  children,
}: {
  children: React.ReactNode
}) {
  const { locale } = useLocale()

  return (
    <section
      className="theme-transition py-12 lg:py-16 bg-(--color-bg)"
      aria-labelledby="categories-heading"
    >
      <Container>
        <div className="mb-8">
          <p className="section-label">{t('home.shopByCategory', locale)}</p>
          <h2 id="categories-heading" className="section-heading">
            {t('home.whatLookingFor', locale)}
          </h2>
        </div>

        {children}

        <div className="mt-6 text-center">
          <Link
            href="/kolekcie"
            className="text-sm font-semibold text-(--color-primary) hover:text-(--color-primary-dark) transition-colors"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
            aria-label={t('home.allCollectionsAria', locale)}
          >
            {t('home.allCollections', locale)}
          </Link>
        </div>
      </Container>
    </section>
  )
}
