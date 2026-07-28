import { getNavCategories } from '@/lib/category-map'
import { getProducts } from '@/lib/catalog/products'
import type { ProductListItem } from '@/lib/catalog/types'
import type { AiProductSummary } from '@/lib/ai/schemas'
import { formatMoney, getProductUrl } from '@/lib/utils'

export type AiProductContext = {
  handle: string
  title: string
  vendor: string
  productType: string
  tags: string[]
  availableForSale: boolean
  priceFrom: string
  imageUrl: string | null
  url: string
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
    priceFrom: formatMoney(money),
    imageUrl: product.featuredImage?.url ?? null,
    url: getProductUrl(product.handle),
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
  const productByHandle = new Map(products.map((product) => [product.handle, product]))
  return handles.map((handle) => {
    const product = productByHandle.get(handle)
    return {
      handle,
      title: product?.title ?? handle.replace(/-/g, ' '),
      vendor: product?.vendor ?? '',
      priceFrom: product?.priceFrom ?? '',
      imageUrl: product?.imageUrl ?? null,
      url: product?.url ?? getProductUrl(handle),
    }
  })
}
