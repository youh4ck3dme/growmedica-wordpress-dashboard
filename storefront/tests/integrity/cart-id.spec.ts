import { test, expect } from '@playwright/test'
import { CART_COOKIE, getCartIdFromCookieHeader } from '../../src/lib/wordpress/cart'

test.describe('Woo cart cookie id', () => {
  test('exports stable cart cookie name', () => {
    expect(CART_COOKIE).toBe('growmedical_cart_id')
  })

  test('reads cart id from cookie header', () => {
    const id = 'woo-cart-v1.payload.hmac'
    expect(getCartIdFromCookieHeader(`${CART_COOKIE}=${id}; path=/`)).toBe(id)
  })

  test('rejects empty / missing cookies', () => {
    expect(getCartIdFromCookieHeader(null)).toBeNull()
    expect(getCartIdFromCookieHeader('')).toBeNull()
    expect(getCartIdFromCookieHeader('other=1')).toBeNull()
  })
})
