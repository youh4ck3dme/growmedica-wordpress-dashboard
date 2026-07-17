import { isShopifyMockMode } from '@/lib/shopify/mock'
import { isWooMockMode } from '@/lib/wordpress/mock'
import { getProductByHandle, getProducts } from '@/lib/catalog/products'
import { adminGraphql, isShopifyAdminConfigured } from './client'
import type { AdminProductDetail, AdminProductSummary, ProductUpdateInput } from './types'

type AdminProductNode = {
  id: string
  handle: string
  title: string
  status: string
  descriptionHtml: string
  variants: {
    edges: Array<{
      node: {
        id: string
        price: string
        inventoryQuantity: number | null
        inventoryPolicy: string
        inventoryItem?: { tracked: boolean }
      }
    }>
  }
}

function mapAdminProduct(node: AdminProductNode): AdminProductDetail {
  const variant = node.variants.edges[0]?.node
  const tracked = variant?.inventoryItem?.tracked ?? true
  const qty = variant?.inventoryQuantity ?? null
  const available =
    variant?.inventoryPolicy === 'CONTINUE' || (qty !== null && qty > 0) || !tracked

  return {
    id: node.id,
    productId: node.id,
    variantId: variant?.id ?? '',
    handle: node.handle,
    title: node.title,
    description: node.descriptionHtml ?? '',
    status: node.status,
    price: variant?.price ?? '0',
    currency: 'EUR',
    available,
    inventoryQuantity: qty,
  }
}

function shouldUseCatalogFallback(): boolean {
  return isShopifyMockMode() || isWooMockMode() || !isShopifyAdminConfigured()
}

export async function listAdminProducts(input: {
  search?: string
  limit?: number
}): Promise<AdminProductSummary[]> {
  if (shouldUseCatalogFallback()) {
    const result = await getProducts({ first: input.limit ?? 20, search: input.search, page: 1 })
    return result.edges.map((e) => ({
      id: e.node.id,
      handle: e.node.handle,
      title: e.node.title,
      status: 'ACTIVE',
      price: e.node.priceRange.minVariantPrice.amount,
      currency: e.node.priceRange.minVariantPrice.currencyCode,
      available: e.node.availableForSale,
      inventoryQuantity: null,
    }))
  }

  const limit = Math.min(input.limit ?? 20, 50)
  const query = input.search?.trim() ? `title:*${input.search.trim()}*` : 'status:active'
  const data = await adminGraphql<{ products: { edges: Array<{ node: AdminProductNode }> } }>(
    `query AdminProducts($first: Int!, $query: String) {
      products(first: $first, query: $query, sortKey: TITLE) {
        edges {
          node {
            id
            handle
            title
            status
            descriptionHtml
            variants(first: 1) {
              edges {
                node {
                  id
                  price
                  inventoryQuantity
                  inventoryPolicy
                  inventoryItem { tracked }
                }
              }
            }
          }
        }
      }
    }`,
    { first: limit, query },
  )

  return data.products.edges.map((edge) => mapAdminProduct(edge.node))
}

export async function getAdminProductByHandle(handle: string): Promise<AdminProductDetail | null> {
  if (shouldUseCatalogFallback()) {
    const product = await getProductByHandle(handle)
    if (!product) return null
    return {
      id: product.id,
      productId: product.id,
      variantId: product.variants.edges[0]?.node.id ?? '',
      handle: product.handle,
      title: product.title,
      description: product.description,
      status: 'ACTIVE',
      price: product.priceRange.minVariantPrice.amount,
      currency: product.priceRange.minVariantPrice.currencyCode,
      available: product.availableForSale,
      inventoryQuantity: null,
    }
  }

  const data = await adminGraphql<{ productByHandle: AdminProductNode | null }>(
    `query AdminProduct($handle: String!) {
      productByHandle(handle: $handle) {
        id
        handle
        title
        status
        descriptionHtml
        variants(first: 1) {
          edges {
            node {
              id
              price
              inventoryQuantity
              inventoryPolicy
              inventoryItem { tracked }
            }
          }
        }
      }
    }`,
    { handle },
  )

  if (!data.productByHandle) return null
  return mapAdminProduct(data.productByHandle)
}

export async function updateAdminProduct(
  handle: string,
  input: ProductUpdateInput,
): Promise<AdminProductDetail> {
  if (shouldUseCatalogFallback()) {
    const existing = await getAdminProductByHandle(handle)
    if (!existing) throw new Error(`Product not found: ${handle}`)
    return {
      ...existing,
      title: input.title ?? existing.title,
      description: input.description ?? existing.description,
      price: input.price ?? existing.price,
      available: input.available ?? existing.available,
      inventoryQuantity: input.inventoryQuantity ?? existing.inventoryQuantity,
    }
  }

  const existing = await getAdminProductByHandle(handle)
  if (!existing) throw new Error(`Product not found: ${handle}`)

  if (input.title !== undefined || input.description !== undefined) {
    await adminGraphql(
      `mutation UpdateProduct($input: ProductInput!) {
        productUpdate(input: $input) {
          product { id handle }
          userErrors { field message }
        }
      }`,
      {
        input: {
          id: existing.productId,
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { descriptionHtml: input.description } : {}),
        },
      },
    )
  }

  if (input.price !== undefined && existing.variantId) {
    const result = await adminGraphql<{
      productVariantsBulkUpdate: { userErrors: Array<{ message: string }> }
    }>(
      `mutation UpdateVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          userErrors { message }
        }
      }`,
      {
        productId: existing.productId,
        variants: [{ id: existing.variantId, price: input.price }],
      },
    )
    const errors = result.productVariantsBulkUpdate.userErrors
    if (errors.length > 0) {
      throw new Error(errors.map((e) => e.message).join('; '))
    }
  }

  if (input.inventoryQuantity !== undefined && existing.variantId) {
    const inventoryResult = await adminGraphql<{
      productVariantUpdate: { userErrors: Array<{ message: string }> }
    }>(
      `mutation UpdateInventory($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          userErrors { message }
        }
      }`,
      {
        input: {
          id: existing.variantId,
          inventoryQuantities: [
            {
              availableQuantity: input.inventoryQuantity,
              locationId: await getPrimaryLocationId(),
            },
          ],
        },
      },
    )
    const invErrors = inventoryResult.productVariantUpdate.userErrors
    if (invErrors.length > 0) {
      throw new Error(invErrors.map((e) => e.message).join('; '))
    }
  }

  const updated = await getAdminProductByHandle(handle)
  if (!updated) throw new Error(`Product not found after update: ${handle}`)
  return updated
}

async function getPrimaryLocationId(): Promise<string> {
  const data = await adminGraphql<{ locations: { nodes: Array<{ id: string }> } }>(
    `query { locations(first: 1) { nodes { id } } }`,
  )
  const id = data.locations.nodes[0]?.id
  if (!id) throw new Error('No Shopify location found')
  return id
}

export function isLiveWriteAllowed(): boolean {
  if (isShopifyMockMode() || process.env.MISTRAL_MOCK_MODE === '1') return true
  return process.env.DASHBOARD_ALLOW_LIVE_WRITES === '1'
}
