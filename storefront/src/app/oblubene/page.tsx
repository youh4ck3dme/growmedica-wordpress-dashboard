'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/ui/Container'
import { ProductCard } from '@/components/product/ProductCard'
import { SlidersHorizontal, Heart, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import type { ProductListItem } from '@/lib/shopify/types'
import { Skeleton } from '@/components/ui/Skeleton'

export default function WishlistPage() {
  const [likedHandles, setLikedHandles] = useState<string[]>([])
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load handles from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gm_wishlist')
      if (stored) {
        setLikedHandles(JSON.parse(stored) as string[])
      } else {
        setIsLoading(false)
      }
    } catch {
      setIsLoading(false)
    }
  }, [])

  // Fetch products matching the liked handles
  useEffect(() => {
    if (likedHandles.length === 0) {
      setIsLoading(false)
      return
    }

    async function fetchProducts() {
      try {
        const response = await fetch(`/api/products?handles=${likedHandles.join(',')}`)
        if (response.ok) {
          const data = (await response.json()) as { products: ProductListItem[] }
          setProducts(data.products)
        }
      } catch (err) {
        console.error('Failed to fetch wishlist products:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [likedHandles])

  // Listener to keep wishlist in sync if modified
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>
      if (customEvent.detail) {
        setLikedHandles(customEvent.detail)
      }
    }

    window.addEventListener('wishlist-updated', handleUpdate)
    return () => window.removeEventListener('wishlist-updated', handleUpdate)
  }, [])

  return (
    <div className="py-8 lg:py-12 bg-gray-50/50 min-h-screen">
      <Container>
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-(--color-text) mb-2 flex items-center gap-2">
              <Heart className="h-7 w-7 text-(--color-error) fill-current" />
              Obľúbené produkty
            </h1>
            <p className="text-(--color-text-muted) text-sm">
              Zoznam vašich vybraných produktov, ktoré ste si uložili.
            </p>
          </div>
          {products.length > 0 && (
            <span className="text-xs font-semibold text-(--color-primary) bg-(--color-primary-light) px-3 py-1.5 rounded-full">
              {products.length} {products.length === 1 ? 'položka' : products.length < 5 ? 'položky' : 'položiek'}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center bg-white border border-(--color-border) rounded-2xl shadow-sm max-w-xl mx-auto space-y-4">
            <div className="h-16 w-16 bg-red-50 text-(--color-error) rounded-full flex items-center justify-center mx-auto">
              <Heart className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-(--color-text)">Váš zoznam prianí je prázdny</h3>
              <p className="text-sm text-(--color-text-muted) max-w-md mx-auto">
                Ešte ste si neuložili žiadne produkty. Prejdite do katalógu a označte produkty srdiečkom.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/produkty" className="btn btn-primary">
                Prehliadať katalóg produktov
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Container>
    </div>
  )
}
