'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { dashboardFetch } from '@/lib/dashboard-agent/clientAuth'

type OrderRow = {
  id: string
  name: string
  createdAt: string
  financialStatus: string
  fulfillmentStatus: string
  total: string
  currency: string
  customerName: string
  customerEmail: string
}

type OrdersPanelProps = {
  sessionReady: boolean
}

export default function OrdersPanel({ sessionReady }: OrdersPanelProps) {
  const { t } = useLocale()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionReady) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await dashboardFetch('/api/dashboard/orders?limit=30')
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error ?? t('dashboard.error.ordersLoad'))
        if (!cancelled) setOrders(payload.orders ?? [])
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('dashboard.error.ordersLoad'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [sessionReady, t])

  return (
    <div className="space-y-4" data-testid="dashboard-orders-panel">
      <h2 className="text-lg font-semibold text-(--color-text)">{t('dashboard.nav.orders')}</h2>

      {loading && <p className="text-sm text-(--color-text-muted)">{t('dashboard.orders.loading')}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && orders.length === 0 && !error && (
        <p className="text-sm text-(--color-text-muted)">{t('dashboard.orders.empty')}</p>
      )}

      {orders.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-(--color-border)">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--color-border) bg-(--color-background) text-left text-xs text-(--color-text-muted)">
                <th className="px-3 py-2">{t('dashboard.orders.number')}</th>
                <th className="px-3 py-2">{t('dashboard.orders.customer')}</th>
                <th className="px-3 py-2">{t('dashboard.orders.total')}</th>
                <th className="px-3 py-2">{t('dashboard.orders.status')}</th>
                <th className="px-3 py-2">{t('dashboard.orders.date')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-(--color-border)/50">
                  <td className="px-3 py-2 font-medium">{order.name}</td>
                  <td className="px-3 py-2">
                    <div>{order.customerName}</div>
                    <div className="text-xs text-(--color-text-muted)">{order.customerEmail}</div>
                  </td>
                  <td className="px-3 py-2">
                    {order.total} {order.currency}
                  </td>
                  <td className="px-3 py-2 text-(--color-text-muted)">
                    {order.financialStatus} / {order.fulfillmentStatus}
                  </td>
                  <td className="px-3 py-2 text-(--color-text-muted)">
                    {new Date(order.createdAt).toLocaleDateString('sk-SK')}
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
