/**
 * Unified cart API — Shopify Storefront cart or WooCommerce BFF session.
 */

import { isWordPressCms } from '@/lib/cms'
import * as shopifyCart from '@/lib/shopify/cart'
import * as wooCart from '@/lib/wordpress/cart'
import type { Cart } from '@/lib/shopify/types'

export const CART_COOKIE = shopifyCart.CART_COOKIE
export const normalizeShopifyCartId = shopifyCart.normalizeShopifyCartId

export function getCartIdFromCookieHeader(cookieHeader: string | null): string | null {
  if (isWordPressCms()) {
    return wooCart.getCartIdFromCookieHeader(cookieHeader)
  }
  return shopifyCart.getCartIdFromCookieHeader(cookieHeader)
}

export async function getCart(cartId: string): Promise<Cart | null> {
  if (isWordPressCms()) {
    return wooCart.getWooCart(cartId)
  }
  return shopifyCart.getCart(cartId)
}

export async function createCart(
  lines: Array<{ merchandiseId: string; quantity: number }>,
): Promise<Cart> {
  if (isWordPressCms()) {
    return wooCart.createWooCart(lines)
  }
  return shopifyCart.createCart(lines)
}

export async function addToCart(
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number }>,
): Promise<Cart> {
  if (isWordPressCms()) {
    return wooCart.addToWooCart(cartId, lines)
  }
  return shopifyCart.addToCart(cartId, lines)
}

export async function updateCartLines(
  cartId: string,
  lines: Array<{ id: string; quantity: number }>,
): Promise<Cart> {
  if (isWordPressCms()) {
    return wooCart.updateWooCartLines(cartId, lines)
  }
  return shopifyCart.updateCartLines(cartId, lines)
}

export async function removeCartLines(cartId: string, lineIds: string[]): Promise<Cart> {
  if (isWordPressCms()) {
    return wooCart.removeWooCartLines(cartId, lineIds)
  }
  return shopifyCart.removeCartLines(cartId, lineIds)
}

export async function updateCartDiscountCodes(
  cartId: string,
  discountCodes: string[],
): Promise<Cart> {
  if (isWordPressCms()) {
    return wooCart.updateWooCartDiscountCodes(cartId, discountCodes)
  }
  return shopifyCart.updateCartDiscountCodes(cartId, discountCodes)
}

export function getCheckoutUrl(productId: number, quantity = 1): string | undefined {
  if (isWordPressCms()) {
    return wooCart.getWooCheckoutUrl(productId, quantity)
  }
  return undefined
}
