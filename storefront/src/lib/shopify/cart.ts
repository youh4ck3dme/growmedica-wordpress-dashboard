/**
 * Shopify Cart Operations
 * All cart operations use server actions / API routes
 * Cart ID stored in cookies
 */

import { shopifyFetch } from './client'
import {
  CREATE_CART_MUTATION,
  ADD_TO_CART_MUTATION,
  UPDATE_CART_LINES_MUTATION,
  REMOVE_CART_LINES_MUTATION,
  UPDATE_CART_DISCOUNT_CODES_MUTATION,
} from './mutations'
import { GET_CART_QUERY } from './queries'
import type { Cart } from './types'

const CART_COOKIE_NAME = 'growmedical_cart_id'

// ─── Cookie helpers (server-side) ─────────────────────────────────────────────

export function getCartIdFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`${CART_COOKIE_NAME}=([^;]+)`))
  return match?.[1] ?? null
}

export const CART_COOKIE = CART_COOKIE_NAME

// ─── Cart API ─────────────────────────────────────────────────────────────────

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await shopifyFetch<{ cart: Cart | null }>({
    query: GET_CART_QUERY,
    variables: { cartId },
    cache: 'no-store',
  })
  return data.cart
}

export async function createCart(
  lines: Array<{ merchandiseId: string; quantity: number }>
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartCreate: {
      cart: Cart
      userErrors: Array<{ field: string[]; message: string }>
    }
  }>({
    query: CREATE_CART_MUTATION,
    variables: { lines },
    cache: 'no-store',
  })

  if (data.cartCreate.userErrors.length > 0) {
    throw new Error(data.cartCreate.userErrors.map((e) => e.message).join(', '))
  }

  return data.cartCreate.cart
}

export async function addToCart(
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number }>
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartLinesAdd: {
      cart: Cart
      userErrors: Array<{ field: string[]; message: string }>
    }
  }>({
    query: ADD_TO_CART_MUTATION,
    variables: { cartId, lines },
    cache: 'no-store',
  })

  if (data.cartLinesAdd.userErrors.length > 0) {
    throw new Error(data.cartLinesAdd.userErrors.map((e) => e.message).join(', '))
  }

  return data.cartLinesAdd.cart
}

export async function updateCartLines(
  cartId: string,
  lines: Array<{ id: string; quantity: number }>
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartLinesUpdate: {
      cart: Cart
      userErrors: Array<{ field: string[]; message: string }>
    }
  }>({
    query: UPDATE_CART_LINES_MUTATION,
    variables: { cartId, lines },
    cache: 'no-store',
  })

  if (data.cartLinesUpdate.userErrors.length > 0) {
    throw new Error(data.cartLinesUpdate.userErrors.map((e) => e.message).join(', '))
  }

  return data.cartLinesUpdate.cart
}

export async function removeCartLines(cartId: string, lineIds: string[]): Promise<Cart> {
  const data = await shopifyFetch<{
    cartLinesRemove: {
      cart: Cart
      userErrors: Array<{ field: string[]; message: string }>
    }
  }>({
    query: REMOVE_CART_LINES_MUTATION,
    variables: { cartId, lineIds },
    cache: 'no-store',
  })

  if (data.cartLinesRemove.userErrors.length > 0) {
    throw new Error(data.cartLinesRemove.userErrors.map((e) => e.message).join(', '))
  }

  return data.cartLinesRemove.cart
}

export async function updateCartDiscountCodes(
  cartId: string,
  discountCodes: string[]
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartDiscountCodesUpdate: {
      cart: Cart
      userErrors: Array<{ field: string[]; message: string }>
    }
  }>({
    query: UPDATE_CART_DISCOUNT_CODES_MUTATION,
    variables: { cartId, discountCodes },
    cache: 'no-store',
  })

  if (data.cartDiscountCodesUpdate.userErrors.length > 0) {
    throw new Error(data.cartDiscountCodesUpdate.userErrors.map((e) => e.message).join(', '))
  }

  return data.cartDiscountCodesUpdate.cart
}
