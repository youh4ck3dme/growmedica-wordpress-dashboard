import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Container } from '@/components/ui/Container'
import { FilterableProductList } from '@/components/product/FilterableProductList'
import CollectionHero from '@/components/collection/CollectionHero'
import {
  getCollectionViewByHandle,
  getCollectionViewAllByHandle,
} from '@/lib/catalog/nav'
import { getCollectionMetadata } from '@/lib/seo'
import { getRequestLocale } from '@/lib/i18n/server'
import { t } from '@/lib/i18n/translate'
import { getWooCategoryBySlug } from '@/lib/wordpress/categories'
import { isWordPressCms } from '@/lib/cms'

export const revalidate = 3600

interface CollectionPageProps {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { handle } = await params
  const view = await getCollectionViewByHandle(handle)
  if (!view) return { title: 'Kolekcia nenájdená' }

  return getCollectionMetadata({
    handle: view.handle,
    title: view.title,
    description: view.description ?? '',
    descriptionHtml: view.description ?? '',
    seo: { title: view.title, description: view.description ?? '' },
    updatedAt: new Date().toISOString(),
    image: null,
    id: view.handle,
  })
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const locale = await getRequestLocale()
  const { handle } = await params

  let view: Awaited<ReturnType<typeof getCollectionViewAllByHandle>> = null

  try {
    view = await getCollectionViewAllByHandle(handle)
  } catch {
    notFound()
  }

  if (!view) notFound()

  const wooCategory = isWordPressCms() ? await getWooCategoryBySlug(handle) : null
  const imageUrl = wooCategory?.image?.src ?? null

  return (
    <div className="py-8 lg:py-12">
      <Container>
        <nav aria-label={t('aria.breadcrumb', locale)} className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-(--color-text-muted)">
            <li><Link href="/" className="hover:text-(--color-primary) transition-colors">{t('common.home', locale)}</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/kolekcie" className="hover:text-(--color-primary) transition-colors">{t('nav.collections', locale)}</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-(--color-text) font-medium" aria-current="page">{view.title}</li>
          </ol>
        </nav>

        <CollectionHero
          handle={view.handle}
          title={view.title}
          description={view.description}
          productCount={view.products.length}
          imageUrl={imageUrl}
        />

        <Suspense fallback={<p className="text-sm text-(--color-text-muted)">Načítavam filtre…</p>}>
          <FilterableProductList initialProducts={view.products} />
        </Suspense>
      </Container>
    </div>
  )
}
