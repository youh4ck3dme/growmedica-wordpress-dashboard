'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { dashboardFetch } from '@/lib/dashboard-agent/clientAuth'

type ProductDetail = {
  handle: string
  title: string
  description: string
  price: string
  currency: string
  available: boolean
  inventoryQuantity: number | null
}

type ProductDetailPanelProps = {
  handle: string
  sessionReady: boolean
  onBack: () => void
}

export default function ProductDetailPanel({ handle, sessionReady, onBack }: ProductDetailPanelProps) {
  const { t } = useLocale()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionReady || !handle) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await dashboardFetch(`/api/dashboard/products/${encodeURIComponent(handle)}`)
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error ?? t('dashboard.error.productsLoad'))
        const p = payload.product as ProductDetail
        if (!cancelled) {
          setProduct(p)
          setTitle(p.title)
          setDescription(p.description.replace(/<[^>]+>/g, ''))
          setPrice(p.price)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('dashboard.error.productsLoad'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [sessionReady, handle, t])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.growmedica.cz'

  const save = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const response = await dashboardFetch(`/api/dashboard/products/${encodeURIComponent(handle)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price,
          confirm: true,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? t('dashboard.error.saveFailed'))
      setProduct(payload.product)
      setMessage(t('dashboard.products.savedLive'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dashboard.error.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const runAgentAction = async (command: string) => {
    setMessage(null)
    try {
      const response = await dashboardFetch('/api/dashboard/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? t('dashboard.error.commandFailed'))
      setMessage(payload.reply)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dashboard.error.commandFailed'))
    }
  }

  if (loading) {
    return <p className="text-sm text-(--color-text-muted)">{t('dashboard.products.loading')}</p>
  }

  if (!product) {
    return (
      <div>
        <button type="button" onClick={onBack} className="mb-4 text-sm text-(--color-primary)">
          ← {t('dashboard.products.back')}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4" data-testid="dashboard-product-detail">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="text-sm text-(--color-primary)">
          ← {t('dashboard.products.back')}
        </button>
        <a
          href={`${siteUrl}/produkty/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary text-xs"
        >
          {t('dashboard.products.viewOnSite')}
        </a>
      </div>

      <h2 className="text-lg font-semibold text-(--color-text)">{product.title}</h2>

      <div className="space-y-3">
        <label className="block text-sm">
          <span className="font-medium text-(--color-text)">{t('dashboard.products.title')}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-(--color-border) bg-(--color-background) px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-(--color-text)">{t('dashboard.products.description')}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-lg border border-(--color-border) bg-(--color-background) px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-(--color-text)">{t('dashboard.products.price')}</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-full rounded-lg border border-(--color-border) bg-(--color-background) px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={save} disabled={saving} className="btn btn-primary text-sm">
          {saving ? t('dashboard.products.saving') : t('dashboard.products.save')}
        </button>
        <button
          type="button"
          onClick={() => runAgentAction(`Optimalizuj copy produktu ${handle}`)}
          className="btn btn-secondary text-sm"
        >
          {t('dashboard.products.optimizeCopy')}
        </button>
        <button
          type="button"
          onClick={() => runAgentAction(`SEO pre produkt ${handle}`)}
          className="btn btn-secondary text-sm"
        >
          {t('dashboard.products.generateSeo')}
        </button>
      </div>

      {message && <p className="text-sm text-green-700 whitespace-pre-wrap">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
