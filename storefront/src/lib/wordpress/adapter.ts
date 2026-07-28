/**
 * Maps WooCommerce entities to existing Shopify-shaped storefront types
 * so UI components can migrate incrementally.
 */

import type { Money, Product, ProductListItem, CatalogImage } from '@/lib/catalog/types'
import { getDeepestVisibleProductType } from '@/lib/product-facets'
import { decodeHtmlEntities } from '@/lib/utils'
import type { Locale } from '@/lib/i18n/types'
import type { WooCategory, WooProduct } from './types'

const DEFAULT_CURRENCY = 'EUR'
const SUPPORTED_PRODUCT_LOCALES = new Set(['sk', 'cs', 'en', 'de'])

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

function normalizeProductLocale(locale?: string | null): Locale | null {
  if (!locale) return null
  const code = locale.toLowerCase().slice(0, 2)
  return SUPPORTED_PRODUCT_LOCALES.has(code) ? (code as Locale) : null
}

/**
 * Resolve localized product copy from Woo meta when present.
 * Supported shapes:
 * - name_en / title_cs / _name_de / gm_name_sk
 * - description_en / short_description_cs / gm_description_de
 * - JSON meta `gm_i18n` / `_gm_i18n`: { "en": { "name", "short_description", "description" } }
 * Falls back to default Woo `name` / descriptions (usually SK/CS catalog language).
 */
export function resolveLocalizedProductFields(
  product: WooProduct,
  locale?: string | null,
): { title: string; description: string; descriptionHtml: string; seoDescription: string | null } {
  const loc = normalizeProductLocale(locale)
  const baseTitle = decodeHtmlEntities(product.name)
  const baseShort = product.short_description || ''
  const baseHtml = product.description || ''
  const baseDesc = baseShort || baseHtml

  if (!loc || loc === 'sk') {
    // SK is usually the source catalog language; still allow explicit SK meta overrides.
  }

  let i18nBlock: Record<string, unknown> | null = null
  const rawJson = metaString(product, 'gm_i18n') || metaString(product, '_gm_i18n')
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as Record<string, unknown>
      if (parsed && typeof parsed === 'object') i18nBlock = parsed
    } catch {
      i18nBlock = null
    }
  }

  const fromJson = (field: string): string | null => {
    if (!loc || !i18nBlock) return null
    const block = i18nBlock[loc]
    if (!block || typeof block !== 'object') return null
    const value = (block as Record<string, unknown>)[field]
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  const pickMeta = (...keys: string[]): string | null => {
    for (const key of keys) {
      const value = metaString(product, key)
      if (value) return value
    }
    return null
  }

  const titleRaw =
    (loc &&
      (fromJson('name') ||
        fromJson('title') ||
        pickMeta(
          `name_${loc}`,
          `title_${loc}`,
          `_name_${loc}`,
          `gm_name_${loc}`,
          `name-${loc}`,
        ))) ||
    null

  const shortRaw =
    (loc &&
      (fromJson('short_description') ||
        pickMeta(
          `short_description_${loc}`,
          `_short_description_${loc}`,
          `gm_short_description_${loc}`,
        ))) ||
    null

  const htmlRaw =
    (loc &&
      (fromJson('description') ||
        pickMeta(`description_${loc}`, `_description_${loc}`, `gm_description_${loc}`))) ||
    null

  const title = titleRaw ? decodeHtmlEntities(titleRaw) : baseTitle
  const descriptionHtml = htmlRaw ?? baseHtml
  const description = shortRaw || htmlRaw || baseDesc
  const seoDescription = shortRaw || product.short_description || null

  return { title, description, descriptionHtml, seoDescription }
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

export function wooProductToListItem(
  product: WooProduct,
  locale?: string | null,
): ProductListItem {
  const featuredImage = toImage(product.images[0])
  const price = toMoney(product.price)
  const compareAt = product.on_sale && product.regular_price ? toMoney(product.regular_price) : null
  const { title } = resolveLocalizedProductFields(product, locale)

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

export function wooProductToProduct(
  product: WooProduct,
  locale?: string | null,
): Product {
  const listItem = wooProductToListItem(product, locale)
  const localized = resolveLocalizedProductFields(product, locale)
  const images = product.images.map((image) => ({
    node: toImage(image)!,
  }))

  return {
    ...listItem,
    description: localized.description,
    descriptionHtml: localized.descriptionHtml,
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
      description: localized.seoDescription,
    },
    updatedAt: product.date_modified_gmt,
  }
}

export function wooCategoryToCollectionHandle(category: WooCategory): string {
  return category.slug
}
