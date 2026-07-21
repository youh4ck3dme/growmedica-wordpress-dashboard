'use client'

import { useEffect, useState } from 'react'

export function useCommerceHeaderCounts() {
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)

  useEffect(() => {
    async function fetchCartCount() {
      try {
        const res = await fetch('/api/cart')
        if (res.ok) {
          const data = (await res.json()) as { count?: number }
          if (data.count !== undefined) setCartCount(data.count)
        }
      } catch {
        /* silent */
      }
    }
    fetchCartCount()

    try {
      const stored = localStorage.getItem('gm_wishlist')
      if (stored) {
        setWishlistCount((JSON.parse(stored) as string[]).length)
      }
    } catch {
      /* silent */
    }

    function handleCartCountUpdate(e: Event) {
      setCartCount((e as CustomEvent<number>).detail)
    }
    window.addEventListener('cart-count-updated', handleCartCountUpdate)

    function handleWishlistUpdate(e: Event) {
      const wishlist = (e as CustomEvent<string[]>).detail
      if (wishlist) setWishlistCount(wishlist.length)
    }
    window.addEventListener('wishlist-updated', handleWishlistUpdate)

    return () => {
      window.removeEventListener('cart-count-updated', handleCartCountUpdate)
      window.removeEventListener('wishlist-updated', handleWishlistUpdate)
    }
  }, [])

  return { cartCount, wishlistCount }
}
