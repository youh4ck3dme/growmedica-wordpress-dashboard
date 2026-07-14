/**
 * SEO helpers — metadata generation for Next.js Metadata API
 */

import type { Metadata } from 'next'
import { BRAND_COPY } from './brand'
import type { Product, Collection } from './shopify/types'

const SITE_NAME = BRAND_COPY.siteName
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://growmedica.nexify-studio.tech'
const SITE_DESCRIPTION = BRAND_COPY.siteDescription

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
    locale: 'sk_SK',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export function buildPageMetadata(title: string, description?: string): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
  }
}

export function getProductMetadata(product: Product): Metadata {
  const title = product.seo.title ?? product.title
  const description =
    product.seo.description ?? product.description.slice(0, 160)
  const image = product.featuredImage

  return {
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
    alternates: {
      canonical: `${SITE_URL}/produkty/${product.handle}`,
    },
  }
}

export function getCollectionMetadata(collection: Collection): Metadata {
  const title = collection.seo.title ?? collection.title
  const description = collection.seo.description ?? collection.description.slice(0, 160)
  const image = collection.image

  return {
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
    alternates: {
      canonical: `${SITE_URL}/kolekcie/${collection.handle}`,
    },
  }
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

export function getBundlesPageMetadata(): Metadata {
  const title = BRAND_COPY.bundlesHeading
  const description = BRAND_COPY.pageDescriptions.bundles

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/balicky`,
    },
    alternates: {
      canonical: `${SITE_URL}/balicky`,
    },
  }
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
