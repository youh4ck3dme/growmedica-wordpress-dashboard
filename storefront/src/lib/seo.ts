/**
 * SEO helpers — metadata generation for Next.js Metadata API
 */

import type { Metadata } from 'next'
import { DEFAULT_LOCALE, HREFLANG_MAP, OG_LOCALE_MAP } from '@/lib/i18n/config'
import { SUPPORTED_LOCALES } from '@/lib/i18n/types'
import { resolvePublicSiteUrl } from '@/lib/site-url'
import { BRAND_COPY } from './brand'
import type { Product, ProductListItem, Collection } from './catalog/types'

const SITE_NAME = BRAND_COPY.siteName
const SITE_URL = resolvePublicSiteUrl()
const SITE_DESCRIPTION = BRAND_COPY.siteDescription

/**
 * Soft-launch / pre-index gate.
 * - Default ON (noindex whole shop) until explicitly disabled.
 * - Set SITE_NOINDEX=0 (or false/off/no) on Vercel when ready for Google.
 * - Also reads NEXT_PUBLIC_SITE_NOINDEX for edge/middleware parity.
 */
export function isSiteNoindexEnabled(): boolean {
  const raw =
    process.env.SITE_NOINDEX?.trim() ||
    process.env.NEXT_PUBLIC_SITE_NOINDEX?.trim() ||
    ''
  if (!raw) return true
  const v = raw.toLowerCase()
  if (['0', 'false', 'no', 'off'].includes(v)) return false
  if (['1', 'true', 'yes', 'on'].includes(v)) return true
  return true
}

/** Meta robots for the whole site when soft-launch noindex is on. */
export const SITE_NOINDEX_ROBOTS: NonNullable<Metadata['robots']> = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
}

/** Resolve page robots — global noindex wins over page-level indexability. */
export function resolvePageRobots(indexable = true): Metadata['robots'] {
  if (isSiteNoindexEnabled()) return SITE_NOINDEX_ROBOTS
  return indexable
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      }
    : { index: false, follow: false }
}

/** Attach global noindex when enabled (does not override explicit noindex). */
export function withSiteRobots(metadata: Metadata): Metadata {
  if (!isSiteNoindexEnabled()) return metadata
  return { ...metadata, robots: SITE_NOINDEX_ROBOTS }
}

/** Canonical page URL without locale query params (root has no trailing slash). */
export function buildCanonicalPageUrl(pathname = '/', siteUrl = SITE_URL): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return path === '/' ? siteUrl : `${siteUrl}${path}`
}

function buildLocaleHref(pageUrl: string, locale: string, siteUrl = SITE_URL): string {
  // Root must be `https://host/` before query for valid hreflang (PSI SEO).
  // Compare against the *passed* siteUrl (tests/CI inject custom base).
  const root = siteUrl.replace(/\/$/, '')
  const normalized =
    pageUrl === root || pageUrl === `${root}/` ? `${root}/` : pageUrl
  return `${normalized}?lang=${locale}`
}

export type HreflangLink = { hrefLang: string; href: string }

/** Hreflang link tags — rendered manually to bypass Next.js root-path query strip. */
export function buildHreflangLinks(pathname = '/', siteUrl = SITE_URL): HreflangLink[] {
  const pageUrl = buildCanonicalPageUrl(pathname, siteUrl)
  const entries: Array<[string, string]> = [
    ...SUPPORTED_LOCALES.map((locale) => [HREFLANG_MAP[locale], locale] as [string, string]),
    ['x-default', DEFAULT_LOCALE],
  ]
  return entries.map(([hrefLang, locale]) => ({
    hrefLang,
    href: buildLocaleHref(pageUrl, locale, siteUrl),
  }))
}

export function buildLocaleAlternates(
  pathname = '/',
  siteUrl = SITE_URL,
): Metadata['alternates'] {
  return {
    canonical: buildCanonicalPageUrl(pathname, siteUrl),
  }
}

export const DEFAULT_METADATA: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: OG_LOCALE_MAP[DEFAULT_LOCALE],
    url: SITE_URL,
    title: BRAND_COPY.siteTitle,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND_COPY.siteTitle,
    description: SITE_DESCRIPTION,
    images: ['/android-chrome-512x512.png'],
  },
  robots: resolvePageRobots(true),
  alternates: buildLocaleAlternates('/'),
}

export function buildPageMetadata(
  title: string,
  description?: string,
  pathname = '/',
): Metadata {
  const pageUrl = buildCanonicalPageUrl(pathname)
  return withSiteRobots({
    title,
    ...(description ? { description } : {}),
    alternates: buildLocaleAlternates(pathname),
    openGraph: {
      title,
      ...(description ? { description } : {}),
      url: pageUrl,
    },
  })
}

export function getProductMetadata(product: Product): Metadata {
  const title = product.seo.title ?? product.title
  const description =
    product.seo.description ?? product.description.slice(0, 160)
  const image = product.featuredImage

  return withSiteRobots({
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: image
        ? [
            {
              url: image.url,
              width: image.width ?? 1200,
              height: image.height ?? 630,
              alt: image.altText ?? title,
            },
          ]
        : [],
    },
    alternates: buildLocaleAlternates(`/produkty/${product.handle}`),
  })
}

export function getCollectionMetadata(collection: Collection): Metadata {
  const title = collection.seo.title ?? collection.title
  const description = collection.seo.description ?? collection.description.slice(0, 160)
  const image = collection.image

  return withSiteRobots({
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: image
        ? [
            {
              url: image.url,
              width: image.width ?? 1200,
              height: image.height ?? 630,
              alt: image.altText ?? title,
            },
          ]
        : [],
    },
    alternates: buildLocaleAlternates(`/kolekcie/${collection.handle}`),
  })
}

export function getProductJsonLd(product: Product) {
  const firstVariant = product.variants.edges[0]?.node
  const price = firstVariant?.price.amount ?? product.priceRange.minVariantPrice.amount
  const currency = firstVariant?.price.currencyCode ?? 'EUR'

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: product.vendor,
    },
    image: product.images.edges.map((e) => e.node.url),
    sku: firstVariant?.sku ?? undefined,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: product.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
  }
}

export function getBreadcrumbJsonLd(
  items: Array<{ name: string; item: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  }
}

export function getOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: BRAND_COPY.heroSubtitle,
    slogan: BRAND_COPY.heroSubtitleShort,
  }
}

/** Escape JSON for safe embedding in <script type="application/ld+json">. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function getBundlesPageMetadata(): Metadata {
  const title = BRAND_COPY.bundlesHeading
  const description = BRAND_COPY.pageDescriptions.bundles

  return withSiteRobots({
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/balicky`,
    },
    alternates: buildLocaleAlternates('/balicky'),
  })
}

export function getBundleCatalogItemListJsonLd(
  bundles: ReadonlyArray<{ name: string; slug: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: BRAND_COPY.bundlesHeading,
    description: BRAND_COPY.pageDescriptions.bundles,
    numberOfItems: bundles.length,
    itemListElement: bundles.map((bundle, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: bundle.name,
      url: `${SITE_URL}/balicky#${bundle.slug}`,
    })),
  }
}

/** Product/Offer JSON-LD for a bundle that has a real WooCommerce product behind it. */
export function getBundleProductJsonLd(
  bundle: { name: string; slug: string; items: readonly string[] },
  product: ProductListItem,
  options?: { imageUrl?: string | null },
) {
  const variant = product.variants.edges[0]?.node
  const price = variant?.price ?? product.priceRange.minVariantPrice
  const currency = price?.currencyCode ?? 'EUR'

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Balíček: ${bundle.name}`,
    description: `Balíček GrowMedica — obsahuje: ${bundle.items.join(', ')}.`,
    url: `${SITE_URL}/balicky#${bundle.slug}`,
    image: (() => {
      const src = options?.imageUrl || product.featuredImage?.url
      return src ? [src] : undefined
    })(),
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      price: price?.amount,
      priceCurrency: currency,
      url: `${SITE_URL}/balicky#${bundle.slug}`,
      availability: product.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
  }
}
