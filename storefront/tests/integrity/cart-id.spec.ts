import { test, expect } from '@playwright/test'
import { normalizeShopifyCartId } from '../../src/lib/shopify/cart'

test.describe('Shopify cart id normalization', () => {
  test('accepts valid cart GIDs including private key suffix', () => {
    const id =
      'gid://shopify/Cart/hWNEVQNQjucMBcEtAO0gty8w?key=aef8a83d493ee61af0677d52d747c788'
    expect(normalizeShopifyCartId(id)).toBe(id)
  })

  test('decodes URL-encoded cart GIDs from cookies', () => {
    const encoded =
      'gid%3A%2F%2Fshopify%2FCart%2FhWNEVQNQjucMBcEtAO0gty8w%3Fkey%3Daef8a83d493ee61af0677d52d747c788'
    expect(normalizeShopifyCartId(encoded)).toBe(
      'gid://shopify/Cart/hWNEVQNQjucMBcEtAO0gty8w?key=aef8a83d493ee61af0677d52d747c788',
    )
  })

  test('rejects corrupt legacy cookie values that caused /api/cart 500', () => {
    expect(normalizeShopifyCartId(undefined)).toBeNull()
    expect(normalizeShopifyCartId(null)).toBeNull()
    expect(normalizeShopifyCartId('')).toBeNull()
    expect(normalizeShopifyCartId('undefined')).toBeNull()
    expect(normalizeShopifyCartId('null')).toBeNull()
    expect(normalizeShopifyCartId('12345')).toBeNull()
    expect(normalizeShopifyCartId('woo-cart-abc')).toBeNull()
  })
})
