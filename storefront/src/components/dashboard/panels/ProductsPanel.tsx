'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { dashboardFetch } from '@/lib/dashboard-agent/clientAuth'

type ProductRow = {
  handle: string
  title: string
  price: string
  currency: string
  available: boolean
}

type ProductsPanelProps = {
  sessionReady: boolean
  onSelectProduct: (handle: string) => void
}

export default function ProductsPanel({ sessionReady, onSelectProduct }: ProductsPanelProps) {
  const { t } = useLocale()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = async (query?: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (query?.trim()) params.set('search', query.trim())
      const response = await dashboardFetch(`/api/dashboard/products?${params}`)
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? t('dashboard.error.productsLoad'))
      setProducts(payload.products ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dashboard.error.productsLoad'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!sessionReady) return
    void loadProducts()
  }, [sessionReady])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.growmedica.cz'

  return (
    <div className="space-y-4" data-testid="dashboard-products-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-(--color-text)">{t('dashboard.nav.products')}</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void loadProducts(search)
          }}
        >
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('dashboard.products.search')}
            className="rounded-lg border border-(--color-border) bg-(--color-background) px-3 py-1.5 text-sm"
          />
          <button type="submit" className="btn btn-secondary text-sm" disabled={loading}>
            {t('dashboard.products.searchBtn')}
          </button>
        </form>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-(--color-text-muted)">{t('dashboard.products.loading')}</p>}

      <div className="overflow-x-auto rounded-lg border border-(--color-border)">
        <table className="w-full text-sm" data-testid="dashboard-products-table">
          <thead>
            <tr className="border-b border-(--color-border) bg-(--color-background) text-left text-xs text-(--color-text-muted)">
              <th className="px-3 py-2">{t('dashboard.products.title')}</th>
              <th className="px-3 py-2">{t('dashboard.products.price')}</th>
              <th className="px-3 py-2">{t('dashboard.products.available')}</th>
              <th className="px-3 py-2">{t('dashboard.products.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.handle} className="border-b border-(--color-border)/50">
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onSelectProduct(product.handle)}
                    className="font-medium text-(--color-primary) hover:underline"
                  >
                    {product.title}
                  </button>
                  <p className="text-xs text-(--color-text-muted)">{product.handle}</p>
                </td>
                <td className="px-3 py-2">
                  {product.price} {product.currency}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                      product.available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.available ? t('dashboard.products.inStock') : t('dashboard.products.outOfStock')}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <a
                    href={`${siteUrl}/produkty/${product.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-(--color-primary) hover:underline"
                  >
                    {t('dashboard.products.viewOnSite')}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
