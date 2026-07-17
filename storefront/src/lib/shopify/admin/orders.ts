import { isShopifyMockMode } from '@/lib/shopify/mock'
import { isWooMockMode } from '@/lib/wordpress/mock'
import { adminGraphql } from './client'
import type { AdminOrderSummary } from './types'

const MOCK_ORDERS: AdminOrderSummary[] = [
  {
    id: 'gid://shopify/Order/1',
    name: '#1001',
    createdAt: new Date().toISOString(),
    financialStatus: 'PAID',
    fulfillmentStatus: 'UNFULFILLED',
    total: '29.90',
    currency: 'EUR',
    customerName: 'Test Zákazník',
    customerEmail: 'test@growmedica.cz',
  },
]

export async function listAdminOrders(limit = 20): Promise<AdminOrderSummary[]> {
  if (isShopifyMockMode() || isWooMockMode()) {
    return MOCK_ORDERS.slice(0, limit)
  }

  const first = Math.min(limit, 50)
  try {
    const data = await adminGraphql<{
      orders: {
        edges: Array<{
          node: {
            id: string
            name: string
            createdAt: string
            displayFinancialStatus: string
            displayFulfillmentStatus: string
            totalPriceSet: { shopMoney: { amount: string; currencyCode: string } }
            customer: { displayName: string; email: string } | null
          }
        }>
      }
    }>(
      `query AdminOrders($first: Int!) {
        orders(first: $first, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              createdAt
              displayFinancialStatus
              displayFulfillmentStatus
              totalPriceSet { shopMoney { amount currencyCode } }
              customer { displayName email }
            }
          }
        }
      }`,
      { first },
    )

    return data.orders.edges.map((edge) => ({
      id: edge.node.id,
      name: edge.node.name,
      createdAt: edge.node.createdAt,
      financialStatus: edge.node.displayFinancialStatus,
      fulfillmentStatus: edge.node.displayFulfillmentStatus,
      total: edge.node.totalPriceSet.shopMoney.amount,
      currency: edge.node.totalPriceSet.shopMoney.currencyCode,
      customerName: edge.node.customer?.displayName ?? '—',
      customerEmail: edge.node.customer?.email ?? '—',
    }))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/access denied|protected customer data|read_orders/i.test(message)) {
      return []
    }
    throw error
  }
}

export async function getAdminOrder(orderId: string): Promise<AdminOrderSummary | null> {
  if (isShopifyMockMode() || isWooMockMode()) {
    return MOCK_ORDERS.find((o) => o.id === orderId || o.name === orderId) ?? MOCK_ORDERS[0] ?? null
  }

  const gid = orderId.startsWith('gid://') ? orderId : `gid://shopify/Order/${orderId}`
  try {
    const data = await adminGraphql<{
      order: {
        id: string
        name: string
        createdAt: string
        displayFinancialStatus: string
        displayFulfillmentStatus: string
        totalPriceSet: { shopMoney: { amount: string; currencyCode: string } }
        customer: { displayName: string; email: string } | null
      } | null
    }>(
      `query AdminOrder($id: ID!) {
        order(id: $id) {
          id
          name
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet { shopMoney { amount currencyCode } }
          customer { displayName email }
        }
      }`,
      { id: gid },
    )

    if (!data.order) return null
    return {
      id: data.order.id,
      name: data.order.name,
      createdAt: data.order.createdAt,
      financialStatus: data.order.displayFinancialStatus,
      fulfillmentStatus: data.order.displayFulfillmentStatus,
      total: data.order.totalPriceSet.shopMoney.amount,
      currency: data.order.totalPriceSet.shopMoney.currencyCode,
      customerName: data.order.customer?.displayName ?? '—',
      customerEmail: data.order.customer?.email ?? '—',
    }
  } catch {
    return null
  }
}
