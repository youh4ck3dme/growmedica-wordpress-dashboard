'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { dashboardFetch } from '@/lib/dashboard-agent/clientAuth'
import type { AuditEntry } from '@/lib/dashboard-agent/types'

type AuditLogPanelProps = {
  sessionReady: boolean
  refreshKey?: number
}

export default function AuditLogPanel({ sessionReady, refreshKey = 0 }: AuditLogPanelProps) {
  const { t } = useLocale()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await dashboardFetch('/api/dashboard/audit?limit=20')
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? t('dashboard.error.auditUnavailable'))
      setEntries(payload.entries ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dashboard.error.auditLoad'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (sessionReady) void load()
  }, [sessionReady, refreshKey, load])

  return (
    <div className="rounded-lg border border-(--color-border) bg-(--color-surface)" data-testid="dashboard-audit-panel">
      <div className="flex items-center justify-between border-b border-(--color-border) px-4 py-2">
        <h2 className="text-sm font-semibold text-(--color-text)">{t('dashboard.audit.title')}</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1 text-xs text-(--color-text-muted) hover:text-(--color-text)"
          data-testid="dashboard-audit-refresh"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t('dashboard.audit.refresh')}
        </button>
      </div>

      {loading && <p className="px-4 py-3 text-xs text-(--color-text-muted)">{t('dashboard.audit.loading')}</p>}
      {error && <p className="px-4 py-3 text-xs text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-(--color-border) text-(--color-text-muted)">
                <th className="px-4 py-2 font-medium">{t('dashboard.audit.time')}</th>
                <th className="px-4 py-2 font-medium">{t('dashboard.audit.tool')}</th>
                <th className="px-4 py-2 font-medium">{t('dashboard.audit.status')}</th>
                <th className="px-4 py-2 font-medium">{t('dashboard.audit.summary')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-(--color-text-muted)">
                    {t('dashboard.audit.empty')}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-(--color-border)/50" data-testid="dashboard-audit-row">
                    <td className="px-4 py-2 text-(--color-text-muted)">
                      {new Date(entry.timestamp).toLocaleString('sk-SK')}
                    </td>
                    <td className="px-4 py-2 font-mono text-(--color-text)">{entry.tool}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="px-4 py-2 text-(--color-text-muted)">{entry.summary}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: AuditEntry['status'] }) {
  const colors =
    status === 'ok'
      ? 'bg-green-100 text-green-800'
      : status === 'dry_run'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-800'
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${colors}`}>{status}</span>
}
