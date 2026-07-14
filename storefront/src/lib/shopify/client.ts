/**
 * Shopify Storefront API GraphQL Client
 *
 * Rules:
 * - Server-side only (never import in 'use client' components)
 * - No Admin API usage
 * - Typed responses via generics
 * - ISR-friendly cache strategy
 */

import { env } from '@/lib/env'
import { getMockShopifyResponse, isShopifyMockMode } from './mock'
import type { ShopifyResponse } from './types'

function getShopifyGraphqlUrl(): string {
  return `https://${env.SHOPIFY_STORE_DOMAIN}/api/${env.SHOPIFY_API_VERSION}/graphql.json`
}

interface ShopifyFetchOptions {
  query: string
  variables?: Record<string, unknown>
  cache?: RequestCache
  revalidate?: number | false
  tags?: string[]
}

export async function shopifyFetch<T>({
  query,
  variables,
  cache = 'force-cache',
  revalidate = 3600,
  tags,
}: ShopifyFetchOptions): Promise<T> {
  if (isShopifyMockMode()) {
    return getMockShopifyResponse<T>(query, variables)
  }

  const nextOptions: RequestInit['next'] = {}

  if (revalidate !== false) {
    nextOptions.revalidate = revalidate
  }
  if (tags && tags.length > 0) {
    nextOptions.tags = tags
  }

  const response = await fetch(getShopifyGraphqlUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      'X-Shopify-Api-Version': env.SHOPIFY_API_VERSION,
    },
    body: JSON.stringify({ query, variables }),
    cache,
    next: Object.keys(nextOptions).length > 0 ? nextOptions : undefined,
  })

  if (!response.ok) {
    throw new Error(
      `Shopify API error: ${response.status} ${response.statusText} — ${await response.text()}`
    )
  }

  const body = (await response.json()) as ShopifyResponse<T>

  if (body.errors && body.errors.length > 0) {
    const errorMessages = body.errors.map((e) => e.message).join(', ')
    throw new Error(`Shopify GraphQL errors: ${errorMessages}`)
  }

  return body.data
}
