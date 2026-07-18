'use client'

import { useMemo, useState } from 'react'
import {
  BUNDLE_CATEGORY_LABELS,
  type HealthBundle,
} from '@/lib/bundles/catalog'
import type { ProductListItem } from '@/lib/catalog/types'
import { BundleCard } from '@/components/bundle/BundleCard'
import { cn } from '@/lib/utils'

interface BundleCatalogProps {
  bundles: readonly HealthBundle[]
  productsByHandle: Map<string, ProductListItem>
}

const ALL_CATEGORY = 'vsetky' as const

export function BundleCatalog({ bundles, productsByHandle }: BundleCatalogProps) {
  const categories = useMemo(() => {
    const seen = new Map<HealthBundle['category'], number>()
    for (const bundle of bundles) {
      seen.set(bundle.category, (seen.get(bundle.category) ?? 0) + 1)
    }
    return Array.from(seen.entries())
  }, [bundles])

  const [selected, setSelected] = useState<HealthBundle['category'] | typeof ALL_CATEGORY>(
    ALL_CATEGORY,
  )

  const filtered = useMemo(
    () => (selected === ALL_CATEGORY ? bundles : bundles.filter((b) => b.category === selected)),
    [bundles, selected],
  )

  const available = filtered.filter((b) => productsByHandle.has(b.slug))
  const comingSoon = filtered.filter((b) => !productsByHandle.has(b.slug))

  return (
    <div>
      <div
        className="mb-8 flex flex-wrap gap-2"
        role="group"
        aria-label="Filtrovať balíčky podľa kategórie"
      >
        <button
          type="button"
          onClick={() => setSelected(ALL_CATEGORY)}
          className={cn('bundle-filter-chip', selected === ALL_CATEGORY && 'bundle-filter-chip--active')}
        >
          Všetky ({bundles.length})
        </button>
        {categories.map(([category, count]) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelected(category)}
            className={cn('bundle-filter-chip', selected === category && 'bundle-filter-chip--active')}
          >
            {BUNDLE_CATEGORY_LABELS[category]} ({count})
          </button>
        ))}
      </div>

      {available.length > 0 && (
        <section className="mb-10" aria-labelledby="bundles-available-heading">
          <h2 id="bundles-available-heading" className="text-lg font-bold text-(--color-text) mb-4">
            Dostupné teraz
          </h2>
          <div className="bundle-grid">
            {available.map((bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} product={productsByHandle.get(bundle.slug)} />
            ))}
          </div>
        </section>
      )}

      {comingSoon.length > 0 && (
        <section aria-labelledby="bundles-soon-heading">
          <h2 id="bundles-soon-heading" className="text-lg font-bold text-(--color-text) mb-4">
            Pripravujeme
          </h2>
          <div className="bundle-grid">
            {comingSoon.map((bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} product={null} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
