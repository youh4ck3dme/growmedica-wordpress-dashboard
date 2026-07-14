import '../helpers/shopify-env'
import { expect, test } from '@playwright/test'
import { getCollectionViewByHandle } from '../../src/lib/shopify/collection-nav'

type ShopifyFetchCall = {
  operation: string
  variables: Record<string, unknown>
}

type ProductEdge = { node: ReturnType<typeof productNode>; cursor: string }

function pageInfo(hasNextPage: boolean, endCursor: string | null = null) {
  return {
    hasNextPage,
    hasPreviousPage: false,
    startCursor: null,
    endCursor,
  }
}

function productNode(handle: string) {
  return {
    id: `gid://shopify/Product/${handle}`,
    handle,
    title: handle,
    vendor: 'Risk Covered',
    productType: 'DOPLNKY VYZIVY',
    tags: ['Vitaminy'],
    availableForSale: true,
    priceRange: {
      minVariantPrice: { amount: '10.00', currencyCode: 'EUR' },
      maxVariantPrice: { amount: '10.00', currencyCode: 'EUR' },
    },
    compareAtPriceRange: {
      minVariantPrice: { amount: '10.00', currencyCode: 'EUR' },
      maxVariantPrice: { amount: '10.00', currencyCode: 'EUR' },
    },
    featuredImage: null,
    variants: { edges: [] },
  }
}

function productsConnection(
  edges: ProductEdge[],
  hasNextPage: boolean,
) {
  return {
    edges,
    pageInfo: pageInfo(hasNextPage, hasNextPage ? 'cursor-page-1' : null),
  }
}

type ProductsConnectionOptions = {
  pageOneEdges?: ProductEdge[]
  pageOneHasNext?: boolean
  finalPageEdges?: ProductEdge[]
  collectionPages?: {
    first: ReturnType<typeof productsConnection>
    afterCursor?: ReturnType<typeof productsConnection>
  }
}

function installShopifyFetchMock({
  pageOneEdges = [],
  pageOneHasNext = false,
  finalPageEdges = [],
  collectionPages,
}: ProductsConnectionOptions = {}) {
  const calls: ShopifyFetchCall[] = []
  const originalFetch = globalThis.fetch
  const previousMockMode = process.env.SHOPIFY_MOCK_MODE
  process.env.SHOPIFY_MOCK_MODE = '0'

  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body ?? '{}')) as {
      query?: string
      variables?: Record<string, unknown>
    }
    const query = body.query ?? ''
    const variables = body.variables ?? {}

    if (query.includes('query GetCollectionByHandle')) {
      calls.push({ operation: 'GetCollectionByHandle', variables })
      if (!collectionPages) {
        return Response.json({ data: { collection: null } })
      }

      const products =
        variables.after === undefined ? collectionPages.first : collectionPages.afterCursor

      return Response.json({
        data: {
          collection: {
            id: `gid://shopify/Collection/${variables.handle}`,
            handle: variables.handle,
            title: `Collection ${variables.handle}`,
            description: 'Shopify collection description',
            descriptionHtml: 'Shopify collection description',
            image: null,
            seo: { title: null, description: null },
            updatedAt: '2026-01-01T00:00:00Z',
            products: products ?? productsConnection([], false),
          },
        },
      })
    }

    if (query.includes('query GetProducts')) {
      calls.push({ operation: 'GetProducts', variables })

      if (variables.first === 50) {
        return Response.json({
          data: {
            products: productsConnection(
              [{ node: productNode('vendor-sample'), cursor: 'vendor-sample-cursor' }],
              false,
            ),
          },
        })
      }

      if (variables.after === undefined) {
        return Response.json({
          data: {
            products: productsConnection(pageOneEdges, pageOneHasNext),
          },
        })
      }

      return Response.json({
        data: {
          products: productsConnection(finalPageEdges, false),
        },
      })
    }

    throw new Error(`Unexpected Shopify query in test: ${query}`)
  }

  return {
    calls,
    restore() {
      globalThis.fetch = originalFetch
      if (previousMockMode === undefined) {
        delete process.env.SHOPIFY_MOCK_MODE
      } else {
        process.env.SHOPIFY_MOCK_MODE = previousMockMode
      }
    },
  }
}

test.describe('collection catalog pagination', () => {
  test.describe.configure({ mode: 'serial' })

  test('returns null for an empty first catalog page', async () => {
    const mock = installShopifyFetchMock()

    try {
      const view = await getCollectionViewByHandle('vitaminy-mineraly', { page: 1 })

      expect(view).toBeNull()
      expect(mock.calls.map((call) => call.operation)).toEqual([
        'GetCollectionByHandle',
        'GetProducts',
        'GetProducts',
      ])
    } finally {
      mock.restore()
    }
  })

  test('returns an empty CollectionView for an empty catalog page after page 1', async () => {
    const mock = installShopifyFetchMock({
      pageOneEdges: [{ node: productNode('page-1-product'), cursor: 'cursor-page-1' }],
      pageOneHasNext: true,
    })

    try {
      const view = await getCollectionViewByHandle('vitaminy-mineraly', { page: 2 })

      expect(view).toMatchObject({
        handle: 'vitaminy-mineraly',
        source: 'catalog',
        products: [],
        page: 2,
        hasNextPage: false,
        hasPreviousPage: true,
        totalOnPage: 0,
      })
      expect(view?.availableVendors).toEqual(['Risk Covered'])
      expect(mock.calls.map((call) => call.operation)).toEqual([
        'GetCollectionByHandle',
        'GetProducts',
        'GetProducts',
        'GetProducts',
      ])
      expect(mock.calls.at(-1)?.variables.after).toBe('cursor-page-1')
    } finally {
      mock.restore()
    }
  })

  test('returns the requested Shopify collection page instead of replaying page 1', async () => {
    const mock = installShopifyFetchMock({
      collectionPages: {
        first: productsConnection(
          [{ node: productNode('shopify-page-1-product'), cursor: 'cursor-page-1' }],
          true,
        ),
        afterCursor: productsConnection(
          [{ node: productNode('shopify-page-2-product'), cursor: 'cursor-page-2' }],
          false,
        ),
      },
    })

    try {
      const view = await getCollectionViewByHandle('vitaminy-mineraly', { page: 2 })

      expect(view).toMatchObject({
        handle: 'vitaminy-mineraly',
        source: 'shopify',
        page: 2,
        hasNextPage: false,
        hasPreviousPage: true,
        totalOnPage: 1,
      })
      expect(view?.products.map((product) => product.handle)).toEqual([
        'shopify-page-2-product',
      ])
      expect(mock.calls.map((call) => call.operation)).toEqual([
        'GetCollectionByHandle',
        'GetCollectionByHandle',
      ])
      expect(mock.calls.at(-1)?.variables.after).toBe('cursor-page-1')
    } finally {
      mock.restore()
    }
  })

  test('returns null for Shopify collection pages beyond the available range', async () => {
    const mock = installShopifyFetchMock({
      collectionPages: {
        first: productsConnection(
          [{ node: productNode('shopify-page-1-product'), cursor: 'cursor-page-1' }],
          false,
        ),
      },
    })

    try {
      const view = await getCollectionViewByHandle('vitaminy-mineraly', { page: 2 })

      expect(view).toBeNull()
      expect(mock.calls.map((call) => call.operation)).toEqual(['GetCollectionByHandle'])
    } finally {
      mock.restore()
    }
  })
})
