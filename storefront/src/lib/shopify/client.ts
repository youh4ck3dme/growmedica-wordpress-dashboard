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
import { buildStorefrontHeaders } from './config'
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
    headers: buildStorefrontHeaders(env.SHOPIFY_API_VERSION, env.SHOPIFY_STOREFRONT_ACCESS_TOKEN),
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
    // Field-level ACCESS_DENIED (e.g. inventory/metafields without scopes) can
    // still return usable `data`. Only hard-fail when the payload is unusable.
    const hasData = body.data != null && Object.values(body.data as object).some((v) => v != null)
    if (!hasData) {
      throw new Error(`Shopify GraphQL errors: ${errorMessages}`)
    }
    console.warn(`[shopifyFetch] GraphQL field errors (using partial data): ${errorMessages}`)
  }

  return body.data
}
