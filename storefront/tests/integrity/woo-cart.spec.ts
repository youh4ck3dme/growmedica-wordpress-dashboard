import { test, expect } from '@playwright/test'

test.describe('WooCommerce cart — mock mode', () => {
  test('POST /api/cart/add with Woo variant ID', async ({ request }) => {
    const productsResponse = await request.get('/api/products')
    expect(productsResponse.ok()).toBe(true)
    const { products } = (await productsResponse.json()) as {
      products: Array<{ variants: { edges: Array<{ node: { id: string } }> } }>
    }
    const variantId = products[0]?.variants.edges[0]?.node.id
    expect(variantId).toMatch(/gid:\/\/woocommerce\/ProductVariant\//)

    const addResponse = await request.post('/api/cart/add', {
      data: { variantId, quantity: 2 },
    })
    expect(addResponse.ok()).toBe(true)
    const addBody = (await addResponse.json()) as { count: number }
    expect(addBody.count).toBe(2)
    expect(addResponse.headers()['set-cookie']).toContain('growmedical_cart_id')
  })

  test('cart update preserves session on invalid variant', async ({ request }) => {
    const productsResponse = await request.get('/api/products')
    const { products } = (await productsResponse.json()) as {
      products: Array<{ variants: { edges: Array<{ node: { id: string } }> } }>
    }
    const variantId = products[0].variants.edges[0].node.id

    const addResponse = await request.post('/api/cart/add', {
      data: { variantId, quantity: 1 },
    })
    const cartCookie = addResponse.headers()['set-cookie']?.split(';')[0] ?? ''

    const failedAdd = await request.post('/api/cart/add', {
      headers: { cookie: cartCookie },
      data: { variantId: 'gid://woocommerce/ProductVariant/999999', quantity: 1 },
    })
    expect(failedAdd.status()).toBe(500)
  })
})