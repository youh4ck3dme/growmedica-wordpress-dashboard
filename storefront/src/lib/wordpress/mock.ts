import { getNavCategories } from '@/lib/category-map'
import type { Product, ProductListItem } from '@/lib/catalog/types'
import { wooProductToListItem, wooProductToProduct } from './adapter'
import type { WooCategory, WooProduct } from './types'

export function isWooMockMode(): boolean {
  return process.env.WOO_MOCK_MODE === '1'
}

function mockCategories(): WooCategory[] {
  return getNavCategories().map((def, index) => ({
    id: index + 1,
    name: def.title,
    slug: def.slug,
    description: def.description ?? '',
    count: 3,
    parent: 0,
    image: null,
  }))
}

function mockWooProduct(slug: string, categorySlug: string, index: number): WooProduct {
  const price = String(9 + index * 3)
  return {
    id: 1000 + index,
    name: `${slug} Mock ${index}`,
    slug,
    permalink: `/produkt/${slug}/`,
    type: 'simple',
    status: 'publish',
    description: `<p>Mock produkt pre ${categorySlug}</p>`,
    short_description: `Mock produkt ${index}`,
    sku: `MOCK-${slug}-${index}`,
    price,
    regular_price: price,
    sale_price: '',
    on_sale: false,
    stock_status: 'instock',
    stock_quantity: 50,
    categories: [{ id: 1, name: categorySlug, slug: categorySlug }],
    tags: [
      { id: 1, name: '00037', slug: '00037' },
      { id: 2, name: 'podpora imunity', slug: 'podpora-imunity' },
    ],
    images: [{ id: 1, src: '/logo-icon.svg', name: slug, alt: slug }],
    attributes: [],
    meta_data: [{ key: '_shopify_vendor', value: 'MycoMedica' }],
    date_modified_gmt: '2026-01-01T00:00:00Z',
  }
}

let mockProductCache: WooProduct[] | null = null

function allMockProducts(): WooProduct[] {
  if (mockProductCache) return mockProductCache
  const products: WooProduct[] = []
  let idx = 0
  for (const def of getNavCategories()) {
    for (let i = 1; i <= 3; i++) {
      const slug = `${def.slug}-mock-${i}`
      products.push(mockWooProduct(slug, def.slug, idx++))
    }
  }
  products.push(
    mockWooProduct('mycomedica-cordyceps-50-90-rastlinnych-kapsul', 'imunita', idx++),
  )
  mockProductCache = products
  return products
}

export function getMockWooCategories(): WooCategory[] {
  return mockCategories()
}

export function getMockWooProducts(options: {
  page?: number
  perPage?: number
  search?: string
  category?: string
  slug?: string
} = {}): { items: WooProduct[]; total: number; totalPages: number; page: number; perPage: number } {
  const page = options.page ?? 1
  const perPage = options.perPage ?? 24
  let items = allMockProducts()

  if (options.slug) {
    items = items.filter((p) => p.slug === options.slug)
  }
  if (options.category) {
    items = items.filter((p) => p.categories.some((c) => c.slug === options.category))
  }
  if (options.search) {
    const q = options.search.toLowerCase()
    items = items.filter((p) => p.name.toLowerCase().includes(q) || p.slug.includes(q))
  }

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage
  const paged = items.slice(start, start + perPage)

  return { items: paged, total, totalPages, page, perPage }
}

export function getMockWooProductListItems(): ProductListItem[] {
  return allMockProducts().map(wooProductToListItem)
}

export function getMockWooProductBySlug(slug: string): Product | null {
  const product = allMockProducts().find((p) => p.slug === slug)
  return product ? wooProductToProduct(product) : null
}
