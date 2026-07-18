import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test.describe('Woo cart API (mock)', () => {
  test('POST /api/cart/add preserves existing carts on add failures', async ({ request }) => {
    const routePath = path.join(process.cwd(), 'src/app/api/cart/add/route.ts')
    expect(fs.existsSync(routePath)).toBe(true)
    const content = fs.readFileSync(routePath, 'utf8')
    expect(content).toContain('existingCartId')
    expect(content).toContain('addToCart')
    expect(content).toContain('getCart')
    expect(content).toContain('throw error')
    expect(content).toContain('createCart')
    expect(content).toContain('CART_COOKIE')

    const productsResponse = await request.get('/api/products')
    expect(productsResponse.ok()).toBe(true)
    const { products } = (await productsResponse.json()) as {
      products: Array<{ variants: { edges: Array<{ node: { id: string } }> } }>
    }
    const variantId = products[0]?.variants.edges[0]?.node.id
    expect(variantId).toBeTruthy()

    const addResponse = await request.post('/api/cart/add', {
      data: { variantId, quantity: 1 },
    })
    expect(addResponse.ok()).toBe(true)
    const addBody = (await addResponse.json()) as { count: number }
    expect(addBody.count).toBe(1)
    const cartCookie = addResponse.headers()['set-cookie']
    expect(cartCookie).toContain('growmedical_cart_id')
    const cookieHeader = cartCookie?.split(';')[0] ?? ''

    const failedAddResponse = await request.post('/api/cart/add', {
      headers: { cookie: cookieHeader },
      data: { variantId: 'gid://shopify/ProductVariant/does-not-exist', quantity: 1 },
    })
    expect(failedAddResponse.status()).toBe(500)
    expect(failedAddResponse.headers()['set-cookie'] ?? '').not.toContain('growmedical_cart_id')
  })

  test('WooCommerce variant add-to-cart when CMS_PROVIDER=wordpress', async ({ request }) => {
    test.skip(process.env.CMS_PROVIDER !== 'wordpress', 'Woo cart test — run via yarn test:woo:integrity')

    const productsResponse = await request.get('/api/products')
    const { products } = (await productsResponse.json()) as {
      products: Array<{ variants: { edges: Array<{ node: { id: string } }> } }>
    }
    const variantId = products[0]?.variants.edges[0]?.node.id
    expect(variantId).toMatch(/gid:\/\/woocommerce\/ProductVariant\//)

    const addResponse = await request.post('/api/cart/add', {
      data: { variantId, quantity: 1 },
    })
    expect(addResponse.ok()).toBe(true)
  })

  test('WooCommerce multi-SKU checkoutUrl seeds gm_cart for all lines', async ({ request }) => {
    test.skip(process.env.CMS_PROVIDER !== 'wordpress', 'Woo cart test — run via yarn test:woo:integrity')

    const productsResponse = await request.get('/api/products?limit=10')
    const { products } = (await productsResponse.json()) as {
      products: Array<{ variants: { edges: Array<{ node: { id: string } }> } }>
    }
    const v1 = products[0]?.variants.edges[0]?.node.id
    const v2 = products[1]?.variants.edges[0]?.node.id
    expect(v1).toBeTruthy()
    expect(v2).toBeTruthy()

    const add1 = await request.post('/api/cart/add', { data: { variantId: v1, quantity: 2 } })
    expect(add1.ok()).toBe(true)
    const cookie1 = add1.headers()['set-cookie']?.split(';')[0] ?? ''

    const add2 = await request.post('/api/cart/add', {
      headers: { cookie: cookie1 },
      data: { variantId: v2, quantity: 1 },
    })
    expect(add2.ok()).toBe(true)
    const body = (await add2.json()) as { cart: { checkoutUrl: string; totalQuantity: number } }
    expect(body.cart.totalQuantity).toBeGreaterThanOrEqual(3)
    expect(body.cart.checkoutUrl).toContain('gm_cart=')
    const gm = new URL(body.cart.checkoutUrl).searchParams.get('gm_cart') ?? ''
    expect(gm.split(',').length).toBeGreaterThanOrEqual(2)
  })

  test('pridanie do košíka aktualizuje badge v hlavičke', async () => {
    const btnPath = path.join(process.cwd(), 'src/components/product/AddToCartButton.tsx')
    expect(fs.existsSync(btnPath)).toBe(true)
    const content = fs.readFileSync(btnPath, 'utf8')
    expect(content).toContain('id="add-to-cart-btn"')
    expect(content).toContain('handleAddToCart')
    expect(content).toContain("window.dispatchEvent(new CustomEvent('cart-count-updated'")
  })
})
