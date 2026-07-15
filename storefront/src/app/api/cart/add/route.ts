import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createCart, addToCart, getCart, CART_COOKIE } from '@/lib/catalog/cart'
import { normalizeShopifyCartId } from '@/lib/shopify/cart'

export async function POST(request: NextRequest) {
  try {
    const { variantId, quantity = 1 } = (await request.json()) as {
      variantId?: string
      quantity?: number
    }

    if (!variantId) {
      return NextResponse.json({ error: 'variantId is required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const existingCartId = normalizeShopifyCartId(cookieStore.get(CART_COOKIE)?.value)

    let cart
    if (existingCartId) {
      try {
        cart = await addToCart(existingCartId, [{ merchandiseId: variantId, quantity }])
      } catch (error) {
        const existingCart = await getCart(existingCartId)
        if (existingCart) {
          throw error
        }
        // The cart cookie points to a deleted/expired cart, so start a fresh cart.
        cart = await createCart([{ merchandiseId: variantId, quantity }])
      }
    } else {
      cart = await createCart([{ merchandiseId: variantId, quantity }])
    }

    const count = cart.lines.edges.reduce((total: number, edge: { node: { quantity?: number } }) => total + (edge.node.quantity || 0), 0)
    const response = NextResponse.json({ cart, count })

    response.cookies.set(CART_COOKIE, cart.id, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[Cart API] Add error:', error)
    return NextResponse.json({ error: 'Nepodarilo sa pridať do košíka' }, { status: 500 })
  }
}
