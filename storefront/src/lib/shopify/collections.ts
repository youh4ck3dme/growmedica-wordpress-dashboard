/**
 * Collection fetching functions
 */

import { shopifyFetch } from './client'
import {
  GET_COLLECTION_BY_HANDLE_QUERY,
  GET_COLLECTIONS_QUERY,
  GET_COLLECTIONS_PAGINATED_QUERY,
  GET_ALL_COLLECTIONS_FOR_SITEMAP,
} from './queries'
import type { Collection, ProductListItem, Connection } from './types'

interface CollectionWithProducts extends Collection {
  products: Connection<ProductListItem>
}

export async function getCollectionByHandle(
  handle: string,
  productCount = 24,
  after?: string
): Promise<CollectionWithProducts | null> {
  const data = await shopifyFetch<{ collection: CollectionWithProducts | null }>({
    query: GET_COLLECTION_BY_HANDLE_QUERY,
    variables: { handle, first: productCount, after },
    tags: [`collection-${handle}`, 'collections'],
    revalidate: 3600,
  })
  return data.collection
}

export async function getCollections(count = 20) {
  const data = await shopifyFetch<{
    collections: Connection<Omit<Collection, 'descriptionHtml' | 'seo' | 'updatedAt'>>
  }>({
    query: GET_COLLECTIONS_QUERY,
    variables: { first: count },
    tags: ['collections'],
    revalidate: 3600,
  })
  return data.collections.edges.map((e) => e.node)
}

export async function getAllShopifyCollections(): Promise<
  Array<Omit<Collection, 'descriptionHtml' | 'seo' | 'updatedAt'>>
> {
  const collections: Array<Omit<Collection, 'descriptionHtml' | 'seo' | 'updatedAt'>> = []
  let hasNextPage = true
  let after: string | undefined

  while (hasNextPage) {
    const data = await shopifyFetch<{
      collections: Connection<Omit<Collection, 'descriptionHtml' | 'seo' | 'updatedAt'>> & {
        pageInfo: { hasNextPage: boolean; endCursor: string | null }
      }
    }>({
      query: GET_COLLECTIONS_PAGINATED_QUERY,
      variables: { first: 250, after },
      tags: ['collections'],
      revalidate: 3600,
    })

    data.collections.edges.forEach((e) => collections.push(e.node))
    hasNextPage = data.collections.pageInfo.hasNextPage
    after = data.collections.pageInfo.endCursor ?? undefined
  }

  return collections
}

export async function getAllCollectionHandlesForSitemap(): Promise<
  Array<{ handle: string; updatedAt: string }>
> {
  const data = await shopifyFetch<{
    collections: { edges: Array<{ node: { handle: string; updatedAt: string } }> }
  }>({
    query: GET_ALL_COLLECTIONS_FOR_SITEMAP,
    variables: { first: 250 },
    revalidate: 86400,
  })
  return data.collections.edges.map((e) => e.node)
}
