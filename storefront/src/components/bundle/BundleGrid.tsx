import { BundleCard } from '@/components/bundle/BundleCard'
import { HEALTH_BUNDLE_CATALOG, type HealthBundle } from '@/lib/bundles/catalog'
import type { ProductListItem } from '@/lib/shopify/types'

interface BundleGridProps {
  bundles?: readonly HealthBundle[]
  productsByHandle?: Map<string, ProductListItem>
}

export function BundleGrid({
  bundles = HEALTH_BUNDLE_CATALOG,
  productsByHandle,
}: BundleGridProps) {
  return (
    <div className="bundle-grid">
      {bundles.map((bundle) => {
        const product = productsByHandle?.get(bundle.slug) ?? null
        return <BundleCard key={bundle.id} bundle={bundle} product={product} />
      })}
    </div>
  )
}
