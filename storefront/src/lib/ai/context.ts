import { getNavCategories } from '@/lib/category-map'
import { getProducts } from '@/lib/catalog/products'
import type { ProductListItem } from '@/lib/shopify/types'
import type { AiProductSummary } from '@/lib/ai/schemas'

export type AiProductContext = {
  handle: string
  title: string
  vendor: string
  productType: string
  tags: string[]
  availableForSale: boolean
  priceFrom: string
}

function toAiProductContext(product: ProductListItem): AiProductContext {
  const money = product.priceRange.minVariantPrice
  return {
    handle: product.handle,
    title: product.title,
    vendor: product.vendor,
    productType: product.productType,
    tags: product.tags.slice(0, 8),
    availableForSale: product.availableForSale,
    priceFrom: `${money.amount} ${money.currencyCode}`,
  }
}

export async function getRecommendContext(opts?: {
  query?: string
  limit?: number
}): Promise<{ products: AiProductContext[]; categories: string[] }> {
  const limit = Math.min(opts?.limit ?? 60, 100)
  const conn = await getProducts({
    first: limit,
    query: opts?.query,
    sortKey: 'BEST_SELLING',
  })

  const products = conn.edges
    .map((edge) => edge.node)
    .filter((product) => product.availableForSale)
    .map(toAiProductContext)

  const categories = getNavCategories().map((category) => category.title)

  return { products, categories }
}

export function buildProductSummaries(
  handles: string[],
  products: AiProductContext[],
): AiProductSummary[] {
  const titleByHandle = new Map(products.map((product) => [product.handle, product.title]))
  return handles.map((handle) => ({
    handle,
    title: titleByHandle.get(handle) ?? handle.replace(/-/g, ' '),
  }))
}
