import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { createCart, addToCart, getCart, CART_COOKIE } from '@/lib/catalog/cart'

const addSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).optional().default(1),
})

function resolveExistingCartId(raw: string | undefined): string | null {
  if (!raw?.trim() || raw === 'undefined' || raw === 'null') return null
  // Woo cart id is a signed cookie payload (woo-cart-v1.…).
  return raw.trim()
}

function setCartCookie(response: NextResponse, cartId: string) {
  response.cookies.set(CART_COOKIE, cartId, {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = addSchema.parse(await request.json())
    const { variantId, quantity } = body

    const cookieStore = await cookies()
    const existingCartId = resolveExistingCartId(cookieStore.get(CART_COOKIE)?.value)

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

    const count = cart.lines.edges.reduce(
      (total: number, edge: { node: { quantity?: number } }) => total + (edge.node.quantity || 0),
      0,
    )
    const response = NextResponse.json({ cart, count })
    setCartCookie(response, cart.id)
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Neplatné údaje košíka', details: error.flatten() }, { status: 400 })
    }
    console.error('[Cart API] Add error:', error)
    return NextResponse.json({ error: 'Nepodarilo sa pridať do košíka' }, { status: 500 })
  }
}
