'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/components/i18n/LocaleProvider'
import IntegrationStatus from '@/components/dashboard/agent/IntegrationStatus'

type SecretGateProps = {
  onAuthenticated: () => void
  onSubmitSecret: (secret: string) => Promise<boolean>
}

export default function SecretGate({ onAuthenticated, onSubmitSecret }: SecretGateProps) {
  const { t } = useLocale()
  const [secret, setSecret] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [health, setHealth] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    void fetch('/api/dashboard/health')
      .then((r) => r.json())
      .then((data) => setHealth(data as Record<string, string>))
      .catch(() => setHealth(null))
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const ok = await onSubmitSecret(secret.trim())
      if (!ok) {
        setError(t('dashboard.gate.invalidSecret'))
        return
      }
      onAuthenticated()
    } catch {
      setError(t('dashboard.gate.invalidSecret'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-(--color-surface) px-6"
      data-testid="dashboard-secret-gate"
    >
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-(--color-text)">{t('dashboard.title')}</h1>
          <p className="mt-1 text-sm text-(--color-text-muted)">{t('dashboard.gate.subtitle')}</p>
        </div>

        {health && (
          <div className="rounded-lg border border-(--color-border) bg-(--color-background) p-4">
            <p className="mb-2 text-xs font-medium text-(--color-text-muted)">
              {t('dashboard.gate.healthTitle')}
            </p>
            <IntegrationStatus sessionReady health={health} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-medium text-(--color-text)" htmlFor="dashboard-secret">
            {t('dashboard.gate.secretLabel')}
          </label>
          <input
            id="dashboard-secret"
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={t('dashboard.gate.secretPlaceholder')}
            className="w-full rounded-lg border border-(--color-border) bg-(--color-background) px-3 py-2 text-sm text-(--color-text)"
            autoComplete="off"
            data-testid="dashboard-secret-input"
          />
          {error && (
            <p className="text-sm text-red-600" data-testid="dashboard-secret-error">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !secret.trim()}
            className="btn btn-primary w-full"
            data-testid="dashboard-secret-submit"
          >
            {loading ? t('dashboard.gate.submitting') : t('dashboard.gate.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
