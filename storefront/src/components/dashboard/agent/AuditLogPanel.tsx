'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { DASHBOARD_AGENT_SECRET_HEADER } from '@/lib/dashboard-agent/auth'
import type { AuditEntry } from '@/lib/dashboard-agent/types'

type AuditLogPanelProps = {
  agentSecret: string
  refreshKey?: number
}

export default function AuditLogPanel({ agentSecret, refreshKey = 0 }: AuditLogPanelProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/dashboard/audit?limit=20', {
        headers: { [DASHBOARD_AGENT_SECRET_HEADER]: agentSecret },
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Audit log nedostupný')
      setEntries(payload.entries ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba audit logu')
    } finally {
      setLoading(false)
    }
  }, [agentSecret])

  useEffect(() => {
    if (agentSecret) void load()
  }, [agentSecret, refreshKey, load])

  return (
    <div className="rounded-lg border border-(--color-border) bg-(--color-surface)" data-testid="dashboard-audit-panel">
      <div className="flex items-center justify-between border-b border-(--color-border) px-4 py-2">
        <h2 className="text-sm font-semibold text-(--color-text)">Audit log</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1 text-xs text-(--color-text-muted) hover:text-(--color-text)"
          data-testid="dashboard-audit-refresh"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Obnoviť
        </button>
      </div>

      {loading && <p className="px-4 py-3 text-xs text-(--color-text-muted)">Načítavam…</p>}
      {error && <p className="px-4 py-3 text-xs text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-(--color-border) text-(--color-text-muted)">
                <th className="px-4 py-2 font-medium">Čas</th>
                <th className="px-4 py-2 font-medium">Nástroj</th>
                <th className="px-4 py-2 font-medium">Stav</th>
                <th className="px-4 py-2 font-medium">Súhrn</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-(--color-text-muted)">
                    Zatiaľ žiadne záznamy.
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
