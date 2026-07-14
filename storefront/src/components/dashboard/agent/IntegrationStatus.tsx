'use client'

import { useEffect, useState } from 'react'
import { DASHBOARD_AGENT_SECRET_HEADER } from '@/lib/dashboard-agent/auth'

type IntegrationStatusProps = {
  agentSecret: string
}

type StatusPayload = {
  cms_provider?: string
  mistral?: string
  catalog?: string
  write_mode?: string
}

export default function IntegrationStatus({ agentSecret }: IntegrationStatusProps) {
  const [status, setStatus] = useState<StatusPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/dashboard/agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [DASHBOARD_AGENT_SECRET_HEADER]: agentSecret,
          },
          body: JSON.stringify({ command: 'Stav integrácie' }),
        })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error ?? 'Nepodarilo sa načítať stav')
        const action = payload.actions?.[0]
        if (!cancelled) setStatus((action?.result as StatusPayload) ?? null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Chyba stavu integrácie')
        }
      }
    }

    if (agentSecret) void load()
    return () => {
      cancelled = true
    }
  }, [agentSecret])

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" data-testid="dashboard-integration-error">
        {error}
      </div>
    )
  }

  if (!status) {
    return (
      <div className="text-xs text-(--color-text-muted)" data-testid="dashboard-integration-loading">
        Načítavam stav integrácie…
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="dashboard-integration-status">
      <Badge label="CMS" value={status.cms_provider ?? '—'} />
      <Badge label="Mistral" value={status.mistral ?? '—'} />
      <Badge label="Katalóg" value={status.catalog ?? '—'} />
      <Badge label="Zápis" value={status.write_mode ?? '—'} />
    </div>
  )
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-(--color-border) bg-(--color-surface) px-2.5 py-1 text-xs text-(--color-text-muted)">
      <span className="font-medium text-(--color-text)">{label}:</span> {value}
    </span>
  )
}
