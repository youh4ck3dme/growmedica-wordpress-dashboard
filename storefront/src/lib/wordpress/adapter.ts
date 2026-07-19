/**
 * Maps WooCommerce entities to existing Shopify-shaped storefront types
 * so UI components can migrate incrementally.
 */

import type { Money, Product, ProductListItem, CatalogImage } from '@/lib/catalog/types'
import { getDeepestVisibleProductType } from '@/lib/product-facets'
import { decodeHtmlEntities } from '@/lib/utils'
import type { WooCategory, WooProduct } from './types'

const DEFAULT_CURRENCY = 'EUR'

function toMoney(amount: string): Money {
  return { amount: amount || '0', currencyCode: DEFAULT_CURRENCY }
}

function toImage(image: WooProduct['images'][number] | undefined): CatalogImage | null {
  if (!image) return null
  const alt = image.alt || image.name || null
  return {
    id: String(image.id),
    url: image.src,
    altText: alt ? decodeHtmlEntities(alt) : null,
    width: null,
    height: null,
  }
}

function metaString(product: WooProduct, key: string): string | null {
  const entry = product.meta_data?.find((m) => m.key === key)
  if (entry == null || entry.value == null) return null
  const value = String(entry.value).trim()
  return value.length > 0 ? value : null
}

/**
 * Real manufacturer/brand — never Woo tags[0] (often barcode / SKU noise).
 * Prefer Shopify import meta, then Brands for Woo, then safe default.
 */
function normalizeVendorName(raw: string): string {
  const value = raw.trim()
  if (!value) return 'GrowMedica'
  // Shopify import sometimes stored store domain as vendor
  if (/^growmedica(\.sk|\.cz)?$/i.test(value)) return 'GrowMedica'
  return value
}

export function resolveWooVendor(product: WooProduct): string {
  const fromMeta =
    metaString(product, '_shopify_vendor') ||
    metaString(product, 'shopify_vendor') ||
    metaString(product, '_vendor')
  if (fromMeta) return normalizeVendorName(fromMeta)

  const brand = product.brands?.[0]?.name?.trim()
  if (brand) return normalizeVendorName(brand)

  return 'GrowMedica'
}

/** Prefer deepest category name for "Forma / Kategória" facet (last term is usually leaf). */
export function resolveWooProductType(product: WooProduct): string {
  return getDeepestVisibleProductType(
    product.categories.map((category) => decodeHtmlEntities(category.name)),
  )
}

export function wooProductToListItem(product: WooProduct): ProductListItem {
  const featuredImage = toImage(product.images[0])
  const price = toMoney(product.price)
  const compareAt = product.on_sale && product.regular_price ? toMoney(product.regular_price) : null
  const title = decodeHtmlEntities(product.name)

  return {
    id: `gid://woocommerce/Product/${product.id}`,
    handle: product.slug,
    title,
    vendor: resolveWooVendor(product),
    productType: resolveWooProductType(product),
    tags: product.tags.map((tag) => decodeHtmlEntities(tag.name)),
    availableForSale: product.stock_status === 'instock',
    priceRange: {
      minVariantPrice: price,
      maxVariantPrice: price,
    },
    compareAtPriceRange: {
      minVariantPrice: compareAt ?? price,
      maxVariantPrice: compareAt ?? price,
    },
    featuredImage,
    variants: {
      edges: [
        {
          node: {
            id: `gid://woocommerce/ProductVariant/${product.id}`,
            title: 'Default',
            availableForSale: product.stock_status === 'instock',
            selectedOptions: [],
            price,
            compareAtPrice: compareAt,
          },
        },
      ],
    },
  }
}

export function wooProductToProduct(product: WooProduct): Product {
  const listItem = wooProductToListItem(product)
  const images = product.images.map((image) => ({
    node: toImage(image)!,
  }))

  return {
    ...listItem,
    description: product.short_description || product.description,
    descriptionHtml: product.description,
    options: product.attributes.map((attribute) => ({
      id: String(attribute.id),
      name: decodeHtmlEntities(attribute.name),
      values: attribute.options.map((option) => decodeHtmlEntities(option)),
    })),
    variants: {
      edges: [
        {
          node: {
            id: `gid://woocommerce/ProductVariant/${product.id}`,
            title: 'Default',
            availableForSale: product.stock_status === 'instock',
            selectedOptions: [],
            price: listItem.priceRange.minVariantPrice,
            compareAtPrice: listItem.compareAtPriceRange.minVariantPrice,
            sku: product.sku || null,
            quantityAvailable: product.stock_quantity,
            image: listItem.featuredImage,
          },
        },
      ],
    },
    images: { edges: images },
    seo: {
      title: listItem.title,
      description: product.short_description || null,
    },
    updatedAt: product.date_modified_gmt,
  }
}

export function wooCategoryToCollectionHandle(category: WooCategory): string {
  return category.slug
}
