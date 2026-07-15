import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCart, updateCartLines, removeCartLines, CART_COOKIE } from '@/lib/catalog/cart'
import { isWordPressCms } from '@/lib/cms'
import { normalizeShopifyCartId } from '@/lib/shopify/cart'

// Helper to compute total cart item count
function getCartCount(cart: { lines?: { edges?: Array<{ node: { quantity?: number } }> } }) {
  if (!cart?.lines?.edges) return 0
  return cart.lines.edges.reduce((total: number, edge: { node: { quantity?: number } }) => total + (edge.node.quantity || 0), 0)
}

function clearCartCookie(response: NextResponse) {
  response.cookies.set(CART_COOKIE, '', {
    maxAge: 0,
    path: '/',
  })
  return response
}

/** Resolve cart id for the active CMS; drop corrupt Shopify cookies. */
function resolveCartId(rawCartId: string | undefined): {
  cartId: string | null
  shouldClearCookie: boolean
} {
  if (!rawCartId) {
    return { cartId: null, shouldClearCookie: false }
  }

  if (isWordPressCms()) {
    const trimmed = rawCartId.trim()
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
      return { cartId: null, shouldClearCookie: true }
    }
    return { cartId: trimmed, shouldClearCookie: false }
  }

  const cartId = normalizeShopifyCartId(rawCartId)
  return { cartId, shouldClearCookie: !cartId }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const rawCartId = cookieStore.get(CART_COOKIE)?.value
    const { cartId, shouldClearCookie } = resolveCartId(rawCartId)

    if (!cartId) {
      const response = NextResponse.json({ count: 0, cart: null })
      if (shouldClearCookie) clearCartCookie(response)
      return response
    }

    const cart = await getCart(cartId)
    if (!cart) {
      return clearCartCookie(NextResponse.json({ count: 0, cart: null }))
    }

    return NextResponse.json({
      count: getCartCount(cart),
      cart,
    })
  } catch (error) {
    console.error('[Cart API] GET error:', error)
    // Never break the whole storefront chrome over a bad cart cookie.
    return clearCartCookie(NextResponse.json({ count: 0, cart: null }))
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { lineId, quantity } = (await request.json()) as {
      lineId?: string
      quantity?: number
    }

    if (!lineId || quantity === undefined) {
      return NextResponse.json({ error: 'lineId and quantity are required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const { cartId } = resolveCartId(cookieStore.get(CART_COOKIE)?.value)

    if (!cartId) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    const cart = await updateCartLines(cartId, [{ id: lineId, quantity }])
    
    return NextResponse.json({
      count: getCartCount(cart),
      cart,
    })
  } catch (error) {
    console.error('[Cart API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lineId = searchParams.get('lineId')

    if (!lineId) {
      return NextResponse.json({ error: 'lineId query parameter is required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const { cartId } = resolveCartId(cookieStore.get(CART_COOKIE)?.value)

    if (!cartId) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    const cart = await removeCartLines(cartId, [lineId])

    return NextResponse.json({
      count: getCartCount(cart),
      cart,
    })
  } catch (error) {
    console.error('[Cart API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove item from cart' }, { status: 500 })
  }
}
