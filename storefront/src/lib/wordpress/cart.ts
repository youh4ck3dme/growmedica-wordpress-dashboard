/**
 * Headless WooCommerce cart — cookie session BFF mapped to Shopify Cart shape.
 */

import { validateWordPressEnv } from './env'
import { getWooProductBySlug } from './products'
import type { Cart, CartLine, Money } from '@/lib/shopify/types'

const CART_COOKIE_NAME = 'growmedical_cart_id'
const WOO_CART_PREFIX = 'woo-cart-'

export const CART_COOKIE = CART_COOKIE_NAME

type WooCartItem = {
  productId: number
  slug: string
  quantity: number
  variantId: string
}

type WooCartSession = {
  id: string
  items: WooCartItem[]
}

const sessions = new Map<string, WooCartSession>()

export function getCartIdFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`${CART_COOKIE_NAME}=([^;]+)`))
  return match?.[1] ?? null
}

function parseVariantProductId(variantId: string): number {
  const wooMatch = variantId.match(/gid:\/\/woocommerce\/ProductVariant\/(\d+)/)
  if (wooMatch) return Number(wooMatch[1])
  const numeric = Number(variantId)
  if (Number.isFinite(numeric)) return numeric
  throw new Error('Invalid variantId for WooCommerce cart')
}

async function resolveProductByVariantId(variantId: string) {
  const productId = parseVariantProductId(variantId)
  const { getWooProductById } = await import('./products')
  const product = await getWooProductById(productId)
  return { productId, product }
}

function money(amount: number): Money {
  return { amount: amount.toFixed(2), currencyCode: 'EUR' }
}

function getSession(cartId: string): WooCartSession | null {
  return sessions.get(cartId) ?? null
}

function createSessionId(): string {
  return `${WOO_CART_PREFIX}${crypto.randomUUID()}`
}

async function buildCart(session: WooCartSession): Promise<Cart> {
  const env = validateWordPressEnv()
  const lines: CartLine[] = []
  let subtotal = 0

  for (const item of session.items) {
    const product = await getWooProductBySlug(item.slug)
    if (!product) continue

    const unitPrice = parseFloat(product.priceRange.minVariantPrice.amount)
    const lineTotal = unitPrice * item.quantity
    subtotal += lineTotal

    lines.push({
      id: `woo-line-${item.productId}`,
      quantity: item.quantity,
      merchandise: {
        id: item.variantId,
        title: product.title,
        selectedOptions: [],
        product: {
          id: product.id,
          handle: product.handle,
          title: product.title,
          featuredImage: product.featuredImage,
        },
      },
      cost: {
        totalAmount: money(lineTotal),
        subtotalAmount: money(lineTotal),
      },
    })
  }

  const checkoutParams = session.items
    .map((item) => `add-to-cart=${item.productId}&quantity=${item.quantity}`)
    .join('&')
  const checkoutUrl = `${env.WORDPRESS_BASE_URL.replace(/\/$/, '')}/checkout${checkoutParams ? `?${checkoutParams}` : ''}`

  return {
    id: session.id,
    checkoutUrl,
    totalQuantity: session.items.reduce((sum, item) => sum + item.quantity, 0),
    lines: { edges: lines.map((node) => ({ node })) },
    cost: {
      subtotalAmount: money(subtotal),
      totalAmount: money(subtotal),
      totalTaxAmount: null,
    },
    discountCodes: [],
  }
}

export async function getWooCart(cartId: string): Promise<Cart | null> {
  const session = getSession(cartId)
  if (!session) return null
  return buildCart(session)
}

export async function createWooCart(
  lines: Array<{ merchandiseId: string; quantity: number }>,
): Promise<Cart> {
  const id = createSessionId()
  const session: WooCartSession = { id, items: [] }
  sessions.set(id, session)

  for (const line of lines) {
    await addToWooCart(id, [line])
  }

  return (await getWooCart(id))!
}

export async function addToWooCart(
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number }>,
): Promise<Cart> {
  let session = getSession(cartId)
  if (!session) {
    session = { id: cartId, items: [] }
    sessions.set(cartId, session)
  }

  for (const line of lines) {
    const { productId, product } = await resolveProductByVariantId(line.merchandiseId)

    const existing = session.items.find((item) => item.productId === productId)
    if (existing) {
      existing.quantity += line.quantity
    } else {
      session.items.push({
        productId,
        slug: product?.handle ?? `product-${productId}`,
        quantity: line.quantity,
        variantId: line.merchandiseId,
      })
    }
  }

  return buildCart(session)
}

export async function updateWooCartLines(
  cartId: string,
  lines: Array<{ id: string; quantity: number }>,
): Promise<Cart> {
  const session = getSession(cartId)
  if (!session) throw new Error('Cart not found')

  for (const line of lines) {
    const productId = Number(line.id.replace('woo-line-', ''))
    const item = session.items.find((i) => i.productId === productId)
    if (!item) continue
    if (line.quantity <= 0) {
      session.items = session.items.filter((i) => i.productId !== productId)
    } else {
      item.quantity = line.quantity
    }
  }

  return buildCart(session)
}

export async function removeWooCartLines(cartId: string, lineIds: string[]): Promise<Cart> {
  const session = getSession(cartId)
  if (!session) throw new Error('Cart not found')

  const removeIds = new Set(lineIds.map((id) => Number(id.replace('woo-line-', ''))))
  session.items = session.items.filter((item) => !removeIds.has(item.productId))

  return buildCart(session)
}

export async function updateWooCartDiscountCodes(
  cartId: string,
  _discountCodes: string[],
): Promise<Cart> {
  const session = getSession(cartId)
  if (!session) throw new Error('Cart not found')
  return buildCart(session)
}

export function getWooCheckoutUrl(productId: number, quantity = 1): string {
  const env = validateWordPressEnv()
  const base = env.WORDPRESS_BASE_URL.replace(/\/$/, '')
  return `${base}/checkout/?add-to-cart=${productId}&quantity=${quantity}`
}
