'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { dashboardFetch } from '@/lib/dashboard-agent/clientAuth'
import IntegrationStatus from '@/components/dashboard/agent/IntegrationStatus'

type OverviewData = {
  product_count: number
  collection_count: number
  low_stock_count: number
  unavailable_count: number
  recent_orders: Array<{
    name: string
    total: string
    currency: string
    financialStatus: string
    createdAt: string
  }>
  recent_audit: Array<{
    timestamp: string
    tool: string
    status: string
    summary: string
  }>
}

type HomePanelProps = {
  sessionReady: boolean
  onNavigateProducts: () => void
  onNavigateOrders: () => void
  onNavigateInventory: () => void
}

export default function HomePanel({
  sessionReady,
  onNavigateProducts,
  onNavigateOrders,
  onNavigateInventory,
}: HomePanelProps) {
  const { t } = useLocale()
  const [data, setData] = useState<OverviewData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionReady) return
    let cancelled = false

    async function load() {
      try {
        const response = await dashboardFetch('/api/dashboard/overview')
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error ?? t('dashboard.error.overviewLoad'))
        if (!cancelled) setData(payload as OverviewData)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('dashboard.error.overviewLoad'))
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [sessionReady, t])

  return (
    <div className="space-y-6" data-testid="dashboard-home-panel">
      <div>
        <h2 className="text-lg font-semibold text-(--color-text)">{t('dashboard.home.title')}</h2>
        <p className="text-sm text-(--color-text-muted)">{t('dashboard.home.subtitle')}</p>
      </div>

      <IntegrationStatus sessionReady={sessionReady} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!data && !error && (
        <p className="text-sm text-(--color-text-muted)">{t('dashboard.home.loading')}</p>
      )}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('dashboard.home.products')}
              value={String(data.product_count)}
              onClick={onNavigateProducts}
            />
            <StatCard
              label={t('dashboard.home.collections')}
              value={String(data.collection_count)}
            />
            <StatCard
              label={t('dashboard.home.lowStock')}
              value={String(data.low_stock_count)}
              onClick={onNavigateInventory}
              highlight={data.low_stock_count > 0}
            />
            <StatCard
              label={t('dashboard.home.unavailable')}
              value={String(data.unavailable_count)}
              highlight={data.unavailable_count > 0}
            />
          </div>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-(--color-text)">
                {t('dashboard.home.recentOrders')}
              </h3>
              <button
                type="button"
                onClick={onNavigateOrders}
                className="text-xs text-(--color-primary) hover:underline"
              >
                {t('dashboard.home.viewAll')}
              </button>
            </div>
            {data.recent_orders.length === 0 ? (
              <p className="text-sm text-(--color-text-muted)">{t('dashboard.orders.empty')}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-(--color-border)">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-(--color-border) bg-(--color-background) text-left text-xs text-(--color-text-muted)">
                      <th className="px-3 py-2">{t('dashboard.orders.number')}</th>
                      <th className="px-3 py-2">{t('dashboard.orders.total')}</th>
                      <th className="px-3 py-2">{t('dashboard.orders.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_orders.map((order) => (
                      <tr key={order.name} className="border-b border-(--color-border)/50">
                        <td className="px-3 py-2 font-medium">{order.name}</td>
                        <td className="px-3 py-2">
                          {order.total} {order.currency}
                        </td>
                        <td className="px-3 py-2 text-(--color-text-muted)">{order.financialStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-(--color-text)">
              {t('dashboard.home.recentAudit')}
            </h3>
            {data.recent_audit.length === 0 ? (
              <p className="text-sm text-(--color-text-muted)">{t('dashboard.audit.empty')}</p>
            ) : (
              <ul className="space-y-1 text-sm text-(--color-text-muted)">
                {data.recent_audit.map((entry) => (
                  <li key={`${entry.timestamp}-${entry.tool}`} className="rounded border border-(--color-border)/50 px-3 py-2">
                    <span className="font-medium text-(--color-text)">{entry.tool}</span> —{' '}
                    {entry.summary}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  onClick,
  highlight = false,
}: {
  label: string
  value: string
  onClick?: () => void
  highlight?: boolean
}) {
  const className = `rounded-lg border px-4 py-3 text-left transition ${
    highlight
      ? 'border-amber-300 bg-amber-50'
      : 'border-(--color-border) bg-(--color-background)'
  } ${onClick ? 'cursor-pointer hover:border-(--color-primary)' : ''}`

  const content = (
    <>
      <p className="text-xs text-(--color-text-muted)">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-(--color-text)">{value}</p>
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    )
  }

  return <div className={className}>{content}</div>
}
