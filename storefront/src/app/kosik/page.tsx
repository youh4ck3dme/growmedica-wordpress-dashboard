import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Container } from '@/components/ui/Container'
import { EmptyState } from '@/components/ui/EmptyState'
import { InteractiveCart } from '@/components/cart/InteractiveCart'
import { getCart, CART_COOKIE } from '@/lib/catalog/cart'
import type { Cart } from '@/lib/shopify/types'
import { BRAND_COPY } from '@/lib/brand'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...buildPageMetadata('Košík', BRAND_COPY.pageDescriptions.cart),
  robots: { index: false },
}

export default async function KosikPage() {
  const cookieStore = await cookies()
  const cartId = cookieStore.get(CART_COOKIE)?.value

  let cart: Cart | null = null
  if (cartId) {
    try {
      cart = await getCart(cartId)
    } catch {
      // Cart not found or expired
    }
  }

  const lines = cart?.lines.edges.map((e) => e.node) ?? []
  const isEmpty = !cart || lines.length === 0

  return (
    <div className="py-8 lg:py-12 bg-(--color-surface-2) min-h-[70vh]">
      <Container>
        <h1 className="text-3xl font-bold text-(--color-text) mb-8">Košík</h1>

        {isEmpty ? (
          <EmptyState
            icon="cart"
            title="Košík je prázdny"
            description="Pridajte produkty a pokračujte v nákupe."
            actionLabel="Pokračovať v nákupe"
            actionHref="/produkty"
          />
        ) : (
          <InteractiveCart initialCart={cart!} />
        )}
      </Container>
    </div>
  )
}
