import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { updateCartDiscountCodes, CART_COOKIE } from '@/lib/catalog/cart'
import { isWordPressCms } from '@/lib/cms'
import { normalizeShopifyCartId } from '@/lib/shopify/cart'

// Helper to compute total cart item count
function getCartCount(cart: { lines?: { edges?: Array<{ node: { quantity?: number } }> } }) {
  if (!cart?.lines?.edges) return 0
  return cart.lines.edges.reduce((total: number, edge: { node: { quantity?: number } }) => total + (edge.node.quantity || 0), 0)
}

export async function POST(request: NextRequest) {
  try {
    const { discountCode } = (await request.json()) as {
      discountCode?: string
    }

    if (!discountCode || discountCode.trim() === '') {
      return NextResponse.json({ error: 'Discount code is required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const rawCartId = cookieStore.get(CART_COOKIE)?.value
    const cartId = isWordPressCms()
      ? rawCartId?.trim() || null
      : normalizeShopifyCartId(rawCartId)

    if (!cartId) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    const cart = await updateCartDiscountCodes(cartId, [discountCode.trim()])

    return NextResponse.json({
      count: getCartCount(cart),
      cart,
    })
  } catch (error) {
    console.error('[Cart Discount API] POST error:', error)
    return NextResponse.json({ error: 'Failed to apply discount code' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const rawCartId = cookieStore.get(CART_COOKIE)?.value
    const cartId = isWordPressCms()
      ? rawCartId?.trim() || null
      : normalizeShopifyCartId(rawCartId)

    if (!cartId) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    // Pass empty array to remove all applied discount codes
    const cart = await updateCartDiscountCodes(cartId, [])

    return NextResponse.json({
      count: getCartCount(cart),
      cart,
    })
  } catch (error) {
    console.error('[Cart Discount API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove discount codes' }, { status: 500 })
  }
}
