/**
 * Headless WooCommerce cart — serverless-safe cookie payload (no in-memory Map).
 * Cart id cookie value is `woo-cart-v1.<base64url(json)>.<hmac>` so any instance can restore it.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'
import { validateWordPressEnv } from './env'
import { getWooProductBySlug } from './products'
import type { Cart, CartLine, Money } from '@/lib/shopify/types'

const CART_COOKIE_NAME = 'growmedical_cart_id'
const WOO_CART_PREFIX = 'woo-cart-v1.'
const MAX_COOKIE_PAYLOAD_BYTES = 3500

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

type PayloadV1 = {
  v: 1
  items: WooCartItem[]
}

function cartSigningSecret(): string {
  return (
    process.env.WORDPRESS_REVALIDATION_SECRET?.trim() ||
    process.env.DASHBOARD_AGENT_SECRET?.trim() ||
    process.env.SHOPIFY_REVALIDATION_SECRET?.trim() ||
    'growmedica-dev-cart-secret'
  )
}

function signPayload(payloadB64: string): string {
  return createHmac('sha256', cartSigningSecret()).update(payloadB64).digest('base64url').slice(0, 22)
}

function safeEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a)
    const bb = Buffer.from(b)
    if (ba.length !== bb.length) return false
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

/** Encode session items into a portable cart id (stored in the cookie). */
export function encodeWooCartSession(items: WooCartItem[]): string {
  const payload: PayloadV1 = { v: 1, items }
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  if (payloadB64.length > MAX_COOKIE_PAYLOAD_BYTES) {
    throw new Error('Cart is too large to store in cookie')
  }
  const sig = signPayload(payloadB64)
  return `${WOO_CART_PREFIX}${payloadB64}.${sig}`
}

/** Decode cart id cookie back into a session (null if invalid / legacy). */
export function decodeWooCartSession(cartId: string | null | undefined): WooCartSession | null {
  if (!cartId) return null
  const trimmed = cartId.trim()
  if (!trimmed.startsWith(WOO_CART_PREFIX)) return null

  const rest = trimmed.slice(WOO_CART_PREFIX.length)
  const dot = rest.lastIndexOf('.')
  if (dot <= 0) return null

  const payloadB64 = rest.slice(0, dot)
  const sig = rest.slice(dot + 1)
  if (!payloadB64 || !sig || !safeEqual(signPayload(payloadB64), sig)) {
    return null
  }

  try {
    const json = Buffer.from(payloadB64, 'base64url').toString('utf8')
    const data = JSON.parse(json) as PayloadV1
    if (data.v !== 1 || !Array.isArray(data.items)) return null
    const items = data.items
      .filter(
        (item) =>
          item &&
          typeof item.productId === 'number' &&
          typeof item.slug === 'string' &&
          typeof item.quantity === 'number' &&
          item.quantity > 0 &&
          typeof item.variantId === 'string',
      )
      .map((item) => ({
        productId: item.productId,
        slug: item.slug,
        quantity: Math.min(Math.floor(item.quantity), 99),
        variantId: item.variantId,
      }))
    const id = encodeWooCartSession(items)
    return { id, items }
  } catch {
    return null
  }
}

function persistSession(items: WooCartItem[]): WooCartSession {
  const id = encodeWooCartSession(items)
  return { id, items }
}

export function getCartIdFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`${CART_COOKIE_NAME}=([^;]+)`))
  if (!match?.[1]) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
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

function cmsCheckoutBase(): string {
  const env = validateWordPressEnv()
  // Live cms has /kosik (cart) page; /checkout is 404 until Woo pages are created.
  return env.WORDPRESS_BASE_URL.replace(/\/$/, '')
}

function buildCheckoutUrl(items: WooCartItem[]): string {
  const base = cmsCheckoutBase()
  // Woo pages (SK): cart=/kosik, checkout=/kontrola-objednavky
  if (items.length === 0) return `${base}/kosik/`
  // Seed Woo session with first line, land on real checkout page.
  const params = new URLSearchParams()
  params.set('add-to-cart', String(items[0].productId))
  params.set('quantity', String(items[0].quantity))
  return `${base}/kontrola-objednavky/?${params.toString()}`
}

async function buildCart(session: WooCartSession): Promise<Cart> {
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

  return {
    id: session.id,
    checkoutUrl: buildCheckoutUrl(session.items),
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
  const session = decodeWooCartSession(cartId)
  if (!session) return null
  return buildCart(session)
}

export async function createWooCart(
  lines: Array<{ merchandiseId: string; quantity: number }>,
): Promise<Cart> {
  let items: WooCartItem[] = []
  for (const line of lines) {
    items = await mergeLine(items, line.merchandiseId, line.quantity)
  }
  return buildCart(persistSession(items))
}

async function mergeLine(
  items: WooCartItem[],
  merchandiseId: string,
  quantity: number,
): Promise<WooCartItem[]> {
  const { productId, product } = await resolveProductByVariantId(merchandiseId)
  if (!product) {
    throw new Error('Merchandise not found')
  }

  const next = items.map((item) => ({ ...item }))
  const existing = next.find((item) => item.productId === productId)
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, 99)
  } else {
    next.push({
      productId,
      slug: product.handle ?? `product-${productId}`,
      quantity: Math.min(quantity, 99),
      variantId: merchandiseId,
    })
  }
  return next
}

export async function addToWooCart(
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number }>,
): Promise<Cart> {
  const session = decodeWooCartSession(cartId)
  let items = session?.items ? session.items.map((i) => ({ ...i })) : []

  for (const line of lines) {
    items = await mergeLine(items, line.merchandiseId, line.quantity)
  }

  return buildCart(persistSession(items))
}

export async function updateWooCartLines(
  cartId: string,
  lines: Array<{ id: string; quantity: number }>,
): Promise<Cart> {
  const session = decodeWooCartSession(cartId)
  if (!session) throw new Error('Cart not found')

  let items = session.items.map((i) => ({ ...i }))

  for (const line of lines) {
    const productId = Number(line.id.replace('woo-line-', ''))
    if (line.quantity <= 0) {
      items = items.filter((i) => i.productId !== productId)
    } else {
      const item = items.find((i) => i.productId === productId)
      if (item) item.quantity = Math.min(Math.floor(line.quantity), 99)
    }
  }

  return buildCart(persistSession(items))
}

export async function removeWooCartLines(cartId: string, lineIds: string[]): Promise<Cart> {
  const session = decodeWooCartSession(cartId)
  if (!session) throw new Error('Cart not found')

  const removeIds = new Set(lineIds.map((id) => Number(id.replace('woo-line-', ''))))
  const items = session.items.filter((item) => !removeIds.has(item.productId))
  return buildCart(persistSession(items))
}

export async function updateWooCartDiscountCodes(
  cartId: string,
  _discountCodes: string[],
): Promise<Cart> {
  const session = decodeWooCartSession(cartId)
  if (!session) throw new Error('Cart not found')
  return buildCart(session)
}

export function getWooCheckoutUrl(productId: number, quantity = 1): string {
  const base = cmsCheckoutBase()
  // Prefer real checkout page when present; cart page always works as fallback entry.
  return `${base}/kontrola-objednavky/?add-to-cart=${productId}&quantity=${quantity}`
}
