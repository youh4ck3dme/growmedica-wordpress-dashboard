'use client'

import { useEffect, useState } from 'react'

export type ProductSearchHit = {
  handle: string
  title: string
  vendor: string | null
  availableForSale: boolean
  priceLabel: string
}

const DEBOUNCE_MS = 280

/**
 * Debounced live product search against GET /api/search?q=
 * Skips fetch when query.trim().length < 2.
 */
export function useProductSearch(query: string, enabled = true) {
  const [products, setProducts] = useState<ProductSearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setProducts([])
      setLoading(false)
      setError(false)
      return
    }

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setProducts([])
      setLoading(false)
      setError(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(false)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('search failed')
        const data = (await res.json()) as { products: ProductSearchHit[] }
        setProducts(Array.isArray(data.products) ? data.products : [])
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setProducts([])
        setError(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query, enabled])

  return { products, loading, error }
}
