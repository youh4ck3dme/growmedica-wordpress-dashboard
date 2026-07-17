'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { dashboardFetch } from '@/lib/dashboard-agent/clientAuth'

type InventoryRow = {
  handle: string
  title: string
  quantity: number | null
  available: boolean
  sku: string | null
}

type InventoryPanelProps = {
  sessionReady: boolean
}

export default function InventoryPanel({ sessionReady }: InventoryPanelProps) {
  const { t } = useLocale()
  const [items, setItems] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Record<string, string>>({})

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await dashboardFetch('/api/dashboard/inventory?threshold=100&limit=100')
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? t('dashboard.error.inventoryLoad'))
      setItems(payload.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dashboard.error.inventoryLoad'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!sessionReady) return
    void load()
  }, [sessionReady])

  const saveQuantity = async (handle: string) => {
    const raw = editing[handle]
    const quantity = Number(raw)
    if (!Number.isFinite(quantity) || quantity < 0) return

    try {
      const response = await dashboardFetch('/api/dashboard/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, quantity }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? t('dashboard.error.saveFailed'))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dashboard.error.saveFailed'))
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.growmedica.cz'

  return (
    <div className="space-y-4" data-testid="dashboard-inventory-panel">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-(--color-text)">{t('dashboard.nav.inventory')}</h2>
        <button type="button" onClick={load} className="btn btn-secondary text-xs" disabled={loading}>
          {t('dashboard.audit.refresh')}
        </button>
      </div>

      <p className="text-sm text-(--color-text-muted)">{t('dashboard.inventory.hint')}</p>

      {loading && <p className="text-sm text-(--color-text-muted)">{t('dashboard.inventory.loading')}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-(--color-border)">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--color-border) bg-(--color-background) text-left text-xs text-(--color-text-muted)">
                <th className="px-3 py-2">{t('dashboard.products.title')}</th>
                <th className="px-3 py-2">{t('dashboard.inventory.quantity')}</th>
                <th className="px-3 py-2">{t('dashboard.products.available')}</th>
                <th className="px-3 py-2">{t('dashboard.products.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.handle} className="border-b border-(--color-border)/50">
                  <td className="px-3 py-2">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-(--color-text-muted)">{item.handle}</div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      value={editing[item.handle] ?? String(item.quantity ?? 0)}
                      onChange={(e) =>
                        setEditing((current) => ({ ...current, [item.handle]: e.target.value }))
                      }
                      className="w-20 rounded border border-(--color-border) px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                        item.available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.available ? t('dashboard.products.inStock') : t('dashboard.products.outOfStock')}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveQuantity(item.handle)}
                        className="text-xs text-(--color-primary) hover:underline"
                      >
                        {t('dashboard.products.save')}
                      </button>
                      <a
                        href={`${siteUrl}/produkty/${item.handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-(--color-text-muted) hover:underline"
                      >
                        {t('dashboard.products.viewOnSite')}
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
