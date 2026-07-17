import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { getNavCollectionItems } from '@/lib/catalog/nav'
import { buildPageMetadata } from '@/lib/seo'
import { getMegaMenuBannerSrc } from '@/lib/mega-menu-banners'
import { getRequestLocale } from '@/lib/i18n/server'
import { t } from '@/lib/i18n/translate'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return buildPageMetadata(
    t('collections.pageTitle', locale),
    t('collections.pageDescription', locale),
    '/kolekcie',
  )
}

export default async function KolekciePage() {
  const locale = await getRequestLocale()
  let collections: Awaited<ReturnType<typeof getNavCollectionItems>> = []
  try {
    collections = await getNavCollectionItems()
  } catch {
    // Shopify not configured
  }

  return (
    <div className="py-8 lg:py-12 bg-(--color-surface-2) min-h-[60vh]">
      <Container>
        <nav aria-label={t('aria.breadcrumb', locale)} className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-(--color-text-muted)">
            <li>
              <Link href="/" className="hover:text-(--color-primary) transition-colors">
                {t('common.home', locale)}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-(--color-text) font-medium" aria-current="page">
              {t('nav.collections', locale)}
            </li>
          </ol>
        </nav>

        <header className="mb-10 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-bold text-(--color-text) mb-3">
            {t('collections.pageTitle', locale)}
          </h1>
          <p className="text-(--color-text-muted)">
            {t('collections.pageDescription', locale)}
          </p>
        </header>

        {collections.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-(--color-border)">
            <p className="text-(--color-text-muted)">{t('collections.empty', locale)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => {
              const bannerSrc =
                collection.imageUrl || getMegaMenuBannerSrc(collection.handle)

              return (
                <Link
                  key={collection.handle}
                  href={collection.href}
                  className={`group flex h-full flex-col overflow-hidden rounded-xl border border-(--color-border) bg-white shadow-sm transition-all hover:border-(--color-primary-light) hover:shadow-md${bannerSrc ? ' collection-card--has-banner' : ''}`}
                  data-collection-handle={collection.handle}
                  data-banner-src={bannerSrc ?? undefined}
                >
                  <div className="relative h-40 overflow-hidden bg-(--color-primary-light)">
                    {bannerSrc ? (
                      <>
                        <Image
                          src={bannerSrc}
                          alt={collection.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="collection-card-banner-image object-cover object-right transition-transform duration-300 group-hover:scale-105"
                        />
                        <div
                          className="collection-card-banner-overlay absolute inset-0"
                          aria-hidden="true"
                        />
                      </>
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(135deg, var(--color-primary-light) 0%, #C8EFE0 100%)',
                        }}
                        aria-hidden="true"
                      />
                    )}
                    <span className="absolute left-4 top-4 badge badge-brand text-xs uppercase tracking-wide">
                      {t('collections.badge', locale)}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 className="text-xl font-bold text-(--color-text) transition-colors group-hover:text-(--color-primary)">
                          {collection.title}
                        </h2>
                        <span className="shrink-0 text-(--color-primary) opacity-0 transition-opacity group-hover:opacity-100 font-semibold">
                          →
                        </span>
                      </div>
                      {collection.description && (
                        <p className="text-sm text-(--color-text-muted) line-clamp-3 leading-relaxed">
                          {collection.description}
                        </p>
                      )}
                    </div>
                    <p className="mt-5 text-xs text-(--color-text-light)">
                      {collection.productCount}{' '}
                      {collection.productCount === 1
                        ? 'produkt'
                        : collection.productCount < 5
                          ? 'produkty'
                          : 'produktov'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Container>
    </div>
  )
}
