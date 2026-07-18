/**
 * Catalog cart API — WooCommerce cookie session only.
 */

import * as wooCart from '@/lib/wordpress/cart'
import type { Cart } from '@/lib/catalog/types'

export const CART_COOKIE = wooCart.CART_COOKIE

export function getCartIdFromCookieHeader(cookieHeader: string | null): string | null {
  return wooCart.getCartIdFromCookieHeader(cookieHeader)
}

export async function getCart(cartId: string): Promise<Cart | null> {
  return wooCart.getWooCart(cartId)
}

export async function createCart(
  lines: Array<{ merchandiseId: string; quantity: number }>,
): Promise<Cart> {
  return wooCart.createWooCart(lines)
}

export async function addToCart(
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number }>,
): Promise<Cart> {
  return wooCart.addToWooCart(cartId, lines)
}

export async function updateCartLines(
  cartId: string,
  lines: Array<{ id: string; quantity: number }>,
): Promise<Cart> {
  return wooCart.updateWooCartLines(cartId, lines)
}

export async function removeCartLines(cartId: string, lineIds: string[]): Promise<Cart> {
  return wooCart.removeWooCartLines(cartId, lineIds)
}

export async function updateCartDiscountCodes(
  cartId: string,
  discountCodes: string[],
): Promise<Cart> {
  return wooCart.updateWooCartDiscountCodes(cartId, discountCodes)
}

export function getCheckoutUrl(productId: number, quantity = 1): string | undefined {
  return wooCart.getWooCheckoutUrl(productId, quantity)
}
