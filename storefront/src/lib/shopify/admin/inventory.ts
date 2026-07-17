import { isShopifyMockMode } from '@/lib/shopify/mock'
import { isWooMockMode } from '@/lib/wordpress/mock'
import { getProducts } from '@/lib/catalog/products'
import { adminGraphql } from './client'
import type { AdminInventoryItem } from './types'

export async function listAdminInventory(input: {
  lowStockThreshold?: number
  limit?: number
}): Promise<AdminInventoryItem[]> {
  const threshold = input.lowStockThreshold ?? 5
  const limit = Math.min(input.limit ?? 50, 100)

  if (isShopifyMockMode() || isWooMockMode()) {
    const result = await getProducts({ first: limit, page: 1 })
    return result.edges.map((e) => ({
      handle: e.node.handle,
      title: e.node.title,
      variantId: e.node.variants.edges[0]?.node.id ?? '',
      sku: null,
      quantity: e.node.availableForSale ? 100 : 0,
      tracked: true,
      available: e.node.availableForSale,
    }))
  }

  const data = await adminGraphql<{
    products: {
      edges: Array<{
        node: {
          handle: string
          title: string
          variants: {
            edges: Array<{
              node: {
                id: string
                sku: string | null
                inventoryQuantity: number | null
                inventoryPolicy: string
                inventoryItem: { tracked: boolean }
              }
            }>
          }
        }
      }>
    }
  }>(
    `query AdminInventory($first: Int!) {
      products(first: $first, query: "status:active", sortKey: TITLE) {
        edges {
          node {
            handle
            title
            variants(first: 1) {
              edges {
                node {
                  id
                  sku
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
    { first: limit },
  )

  const items: AdminInventoryItem[] = data.products.edges.map((edge) => {
    const variant = edge.node.variants.edges[0]?.node
    const tracked = variant?.inventoryItem?.tracked ?? true
    const qty = variant?.inventoryQuantity ?? null
    const available =
      variant?.inventoryPolicy === 'CONTINUE' || (qty !== null && qty > 0) || !tracked

    return {
      handle: edge.node.handle,
      title: edge.node.title,
      variantId: variant?.id ?? '',
      sku: variant?.sku ?? null,
      quantity: qty,
      tracked,
      available,
    }
  })

  return items.filter((item) => {
    if (!item.tracked) return false
    if (item.quantity === null) return false
    return item.quantity < threshold
  })
}

export async function updateInventoryQuantity(
  handle: string,
  quantity: number,
): Promise<AdminInventoryItem> {
  if (isShopifyMockMode() || isWooMockMode()) {
    const items = await listAdminInventory({ limit: 100 })
    const item = items.find((i) => i.handle === handle)
    if (!item) throw new Error(`Product not found: ${handle}`)
    return { ...item, quantity, available: quantity > 0 }
  }

  const productData = await adminGraphql<{
    productByHandle: {
      handle: string
      title: string
      variants: {
        edges: Array<{
          node: {
            id: string
            sku: string | null
            inventoryItem: { id: string; tracked: boolean }
          }
        }>
      }
    } | null
  }>(
    `query ProductInventory($handle: String!) {
      productByHandle(handle: $handle) {
        handle
        title
        variants(first: 1) {
          edges {
            node {
              id
              sku
              inventoryItem { id tracked }
            }
          }
        }
      }
    }`,
    { handle },
  )

  const product = productData.productByHandle
  if (!product) throw new Error(`Product not found: ${handle}`)
  const variant = product.variants.edges[0]?.node
  if (!variant) throw new Error(`No variant for product: ${handle}`)

  const locationData = await adminGraphql<{ locations: { nodes: Array<{ id: string }> } }>(
    `query { locations(first: 1) { nodes { id } } }`,
  )
  const locationId = locationData.locations.nodes[0]?.id
  if (!locationId) throw new Error('No Shopify location found')

  await adminGraphql(
    `mutation SetInventory($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) {
        userErrors { message }
      }
    }`,
    {
      input: {
        name: 'available',
        reason: 'correction',
        ignoreCompareQuantity: true,
        quantities: [
          {
            inventoryItemId: variant.inventoryItem.id,
            locationId,
            quantity: Math.max(0, quantity),
          },
        ],
      },
    },
  )

  return {
    handle: product.handle,
    title: product.title,
    variantId: variant.id,
    sku: variant.sku,
    quantity,
    tracked: variant.inventoryItem.tracked,
    available: quantity > 0,
  }
}
