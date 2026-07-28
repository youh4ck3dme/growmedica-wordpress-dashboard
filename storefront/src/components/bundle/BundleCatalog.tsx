'use client'

import { useMemo, useState } from 'react'
import {
  BUNDLE_CATEGORY_LABELS,
  type HealthBundle,
} from '@/lib/bundles/catalog'
import type { ProductListItem } from '@/lib/catalog/types'
import { BundleCard } from '@/components/bundle/BundleCard'
import { cn } from '@/lib/utils'
import { useLocale, useT } from '@/components/i18n/LocaleProvider'
import { getBundleCategoryLabel } from '@/lib/i18n/bundles'

interface BundleCatalogProps {
  bundles: readonly HealthBundle[]
  productsByHandle: Map<string, ProductListItem>
}

const ALL_CATEGORY = 'vsetky' as const

export function BundleCatalog({ bundles, productsByHandle }: BundleCatalogProps) {
  const t = useT()
  const { locale } = useLocale()

  const availableBundles = useMemo(
    () => bundles.filter((bundle) => productsByHandle.has(bundle.slug)),
    [bundles, productsByHandle],
  )

  const categories = useMemo(() => {
    const seen = new Map<HealthBundle['category'], number>()
    for (const bundle of availableBundles) {
      seen.set(bundle.category, (seen.get(bundle.category) ?? 0) + 1)
    }
    return Array.from(seen.entries())
  }, [availableBundles])

  const [selected, setSelected] = useState<HealthBundle['category'] | typeof ALL_CATEGORY>(
    ALL_CATEGORY,
  )

  const filteredAvailable = useMemo(
    () =>
      selected === ALL_CATEGORY
        ? availableBundles
        : availableBundles.filter((b) => b.category === selected),
    [availableBundles, selected],
  )

  const comingSoonCount = useMemo(() => {
    const availableSlugs = new Set(availableBundles.map((b) => b.slug))
    const pool = selected === ALL_CATEGORY ? bundles : bundles.filter((b) => b.category === selected)
    return pool.filter((b) => !availableSlugs.has(b.slug)).length
  }, [bundles, availableBundles, selected])

  return (
    <div>
      <div
        className="mb-8 flex flex-wrap gap-2"
        role="group"
        aria-label={t('bundle.filterAria')}
      >
        <button
          type="button"
          onClick={() => setSelected(ALL_CATEGORY)}
          className={cn('bundle-filter-chip', selected === ALL_CATEGORY && 'bundle-filter-chip--active')}
        >
          {t('bundle.filterAll', { count: availableBundles.length })}
        </button>
        {categories.map(([category, count]) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelected(category)}
            className={cn('bundle-filter-chip', selected === category && 'bundle-filter-chip--active')}
          >
            {getBundleCategoryLabel(category, locale, BUNDLE_CATEGORY_LABELS[category])} ({count})
          </button>
        ))}
      </div>

      {filteredAvailable.length > 0 && (
        <section className="mb-10" aria-labelledby="bundles-available-heading">
          <h2 id="bundles-available-heading" className="text-lg font-bold text-(--color-text) mb-4">
            {t('bundle.availableNow')}
          </h2>
          <div className="bundle-grid">
            {filteredAvailable.map((bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} product={productsByHandle.get(bundle.slug)} />
            ))}
          </div>
        </section>
      )}

      {comingSoonCount > 0 && (
        <p className="text-sm text-(--color-text-muted)" data-testid="bundles-coming-soon-teaser">
          {comingSoonCount === 1
            ? t('bundle.comingSoonOne', { count: comingSoonCount })
            : t('bundle.comingSoonMany', { count: comingSoonCount })}
        </p>
      )}
    </div>
  )
}
