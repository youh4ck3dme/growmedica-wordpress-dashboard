'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { dashboardFetch } from '@/lib/dashboard-agent/clientAuth'

type IntegrationStatusProps = {
  sessionReady: boolean
  health?: Record<string, string | boolean> | null
}

type StatusPayload = {
  cms_provider?: string
  mistral?: string
  catalog?: string
  write_mode?: string
}

export default function IntegrationStatus({ sessionReady, health }: IntegrationStatusProps) {
  const { t } = useLocale()
  const [status, setStatus] = useState<StatusPayload | null>(health ? mapHealth(health) : null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (health) {
      setStatus(mapHealth(health))
      return
    }
    if (!sessionReady) return
    let cancelled = false

    async function load() {
      try {
        const response = await dashboardFetch('/api/dashboard/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'Stav integrácie' }),
        })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error ?? t('dashboard.error.integrationLoad'))
        const action = payload.actions?.[0]
        if (!cancelled) setStatus((action?.result as StatusPayload) ?? null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('dashboard.error.integrationLoad'))
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [sessionReady, health, t])

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
        {t('dashboard.integration.loading')}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="dashboard-integration-status">
      <Badge label={t('dashboard.integration.cms')} value={status.cms_provider ?? '—'} />
      <Badge label={t('dashboard.integration.mistral')} value={status.mistral ?? '—'} />
      <Badge label={t('dashboard.integration.catalog')} value={status.catalog ?? '—'} />
      <Badge label={t('dashboard.integration.write')} value={status.write_mode ?? '—'} />
    </div>
  )
}

function mapHealth(health: Record<string, string | boolean>): StatusPayload {
  return {
    cms_provider: String(health.cms_provider ?? '—'),
    mistral: String(health.mistral ?? '—'),
    catalog: String(health.catalog ?? '—'),
    write_mode: String(health.write_mode ?? '—'),
  }
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-(--color-border) bg-(--color-surface) px-2.5 py-1 text-xs text-(--color-text-muted)">
      <span className="font-medium text-(--color-text)">{label}:</span> {value}
    </span>
  )
}
