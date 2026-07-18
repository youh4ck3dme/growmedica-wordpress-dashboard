'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { ensureDashboardSession, checkDashboardSession } from '@/lib/dashboard-agent/clientAuth'
import { LEGACY_NEXUS_ADMIN_URL } from '@/lib/dashboard'
import SecretGate from '@/components/dashboard/SecretGate'
import { DashboardLayout, type DashboardView } from '@/components/dashboard/layout/DashboardLayout'
import HomePanel from '@/components/dashboard/panels/HomePanel'
import ProductsPanel from '@/components/dashboard/panels/ProductsPanel'
import ProductDetailPanel from '@/components/dashboard/panels/ProductDetailPanel'
import OrdersPanel from '@/components/dashboard/panels/OrdersPanel'
import InventoryPanel from '@/components/dashboard/panels/InventoryPanel'
import AgentPanel, { type AgentChatMessage } from '@/components/dashboard/agent/AgentPanel'
import AuditLogPanel from '@/components/dashboard/agent/AuditLogPanel'
import CommandBar from '@/components/dashboard/agent/CommandBar'
import IntegrationStatus from '@/components/dashboard/agent/IntegrationStatus'
import { dashboardFetch } from '@/lib/dashboard-agent/clientAuth'
import type { AgentMode, AgentRunResult } from '@/lib/dashboard-agent/types'
import { AGENT_MODES, isAgentMode } from '@/lib/dashboard-agent/types'

const CONVERSATION_STORAGE_KEY = 'growmedica_dashboard_agent_conversation_id'
const AGENT_MODE_STORAGE_KEY = 'growmedica_dashboard_agent_mode'

export default function DashboardShell() {
  const { t } = useLocale()
  const [authenticated, setAuthenticated] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [activeView, setActiveView] = useState<DashboardView>('home')
  const [selectedHandle, setSelectedHandle] = useState('')
  const [messages, setMessages] = useState<AgentChatMessage[]>([])
  const [conversationId, setConversationId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [auditRefreshKey, setAuditRefreshKey] = useState(0)
  const [agentMode, setAgentMode] = useState<AgentMode>('assist')

  useEffect(() => {
    void checkDashboardSession().then((ok) => {
      setAuthenticated(ok)
      setSessionReady(ok)
      setCheckingSession(false)
    })
  }, [])

  useEffect(() => {
    const stored =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(CONVERSATION_STORAGE_KEY)?.trim() ?? ''
        : ''
    if (stored) {
      setConversationId(stored)
    } else {
      const generated =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `dash-${Math.random().toString(36).slice(2, 12)}`
      setConversationId(generated)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(CONVERSATION_STORAGE_KEY, generated)
      }
    }

    const storedMode =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(AGENT_MODE_STORAGE_KEY)?.trim() ?? ''
        : ''
    if (isAgentMode(storedMode)) {
      setAgentMode(storedMode)
    }
  }, [])

  const handleSecretSubmit = async (secret: string) => {
    const ok = await ensureDashboardSession(secret)
    if (ok) {
      setAuthenticated(true)
      setSessionReady(true)
    }
    return ok
  }

  const changeAgentMode = (mode: AgentMode) => {
    setAgentMode(mode)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AGENT_MODE_STORAGE_KEY, mode)
    }
  }

  const runCommand = async (command: string) => {
    if (!sessionReady) {
      setAgentError(t('dashboard.error.noSession'))
      return
    }

    setAgentError(null)
    setMessages((current) => [...current, { role: 'user', content: command }])
    setIsLoading(true)

    try {
      const response = await dashboardFetch('/api/dashboard/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          conversation_id: conversationId || undefined,
          mode: agentMode,
        }),
      })

      const payload = (await response.json()) as AgentRunResult & { error?: string }
      if (!response.ok) throw new Error(payload.error ?? t('dashboard.error.agentUnavailable'))

      if (payload.conversation_id && payload.conversation_id !== conversationId) {
        setConversationId(payload.conversation_id)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(CONVERSATION_STORAGE_KEY, payload.conversation_id)
        }
      }

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: payload.reply, actions: payload.actions },
      ])
      setAuditRefreshKey((k) => k + 1)
    } catch (error) {
      const message = error instanceof Error ? error.message : t('dashboard.error.commandFailed')
      setAgentError(message)
      setMessages((current) => [...current, { role: 'assistant', content: `❌ ${message}` }])
    } finally {
      setIsLoading(false)
    }
  }

  const navigate = (view: DashboardView) => {
    setActiveView(view)
    if (view !== 'product-detail') setSelectedHandle('')
  }

  const selectProduct = (handle: string) => {
    setSelectedHandle(handle)
    setActiveView('product-detail')
  }

  const modeHintKey =
    agentMode === 'plan'
      ? 'dashboard.agentMode.planHint'
      : agentMode === 'monitor'
        ? 'dashboard.agentMode.monitorHint'
        : 'dashboard.agentMode.assistHint'

  if (checkingSession) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-(--color-text-muted)">
        {t('dashboard.gate.checking')}
      </div>
    )
  }

  if (!authenticated) {
    return (
      <SecretGate
        onAuthenticated={() => {
          setAuthenticated(true)
          setSessionReady(true)
        }}
        onSubmitSecret={handleSecretSubmit}
      />
    )
  }

  return (
    <DashboardLayout activeView={activeView} onNavigate={navigate}>
      {activeView === 'home' && (
        <HomePanel
          sessionReady={sessionReady}
          onNavigateProducts={() => navigate('products')}
          onNavigateOrders={() => navigate('orders')}
          onNavigateInventory={() => navigate('inventory')}
        />
      )}

      {activeView === 'products' && (
        <ProductsPanel sessionReady={sessionReady} onSelectProduct={selectProduct} />
      )}

      {activeView === 'product-detail' && selectedHandle && (
        <ProductDetailPanel
          handle={selectedHandle}
          sessionReady={sessionReady}
          onBack={() => navigate('products')}
        />
      )}

      {activeView === 'orders' && <OrdersPanel sessionReady={sessionReady} />}

      {activeView === 'inventory' && <InventoryPanel sessionReady={sessionReady} />}

      {activeView === 'agent' && (
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-(--color-text)">{t('dashboard.nav.agent')}</h2>
            <Link
              href={LEGACY_NEXUS_ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-(--color-text-muted) hover:text-(--color-text)"
            >
              {t('dashboard.legacyNexus')}
            </Link>
          </div>
          <IntegrationStatus sessionReady={sessionReady} />

          <div className="space-y-2" data-testid="dashboard-agent-mode">
            <p className="text-xs font-medium uppercase tracking-wide text-(--color-text-muted)">
              {t('dashboard.agentMode.label')}
            </p>
            <div className="flex flex-wrap gap-2">
              {AGENT_MODES.map((mode) => {
                const active = agentMode === mode
                const labelKey =
                  mode === 'assist'
                    ? 'dashboard.agentMode.assist'
                    : mode === 'plan'
                      ? 'dashboard.agentMode.plan'
                      : 'dashboard.agentMode.monitor'
                return (
                  <button
                    key={mode}
                    type="button"
                    disabled={isLoading}
                    onClick={() => changeAgentMode(mode)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                      active
                        ? 'border-(--color-primary) bg-(--color-primary) text-white'
                        : 'border-(--color-border) bg-(--color-surface) text-(--color-text-muted) hover:border-(--color-primary) hover:text-(--color-text)'
                    }`}
                    data-testid={`dashboard-agent-mode-${mode}`}
                    aria-pressed={active}
                  >
                    {t(labelKey)}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-(--color-text-muted)" data-testid="dashboard-agent-mode-hint">
              {t(modeHintKey)}
            </p>
          </div>

          <CommandBar disabled={isLoading || !sessionReady} onSubmit={runCommand} />
          {agentError && (
            <p className="text-sm text-red-600" data-testid="dashboard-agent-error">
              {agentError}
            </p>
          )}
          <AgentPanel
            messages={messages}
            isLoading={isLoading}
            onSelectProduct={selectProduct}
          />
        </div>
      )}

      {activeView === 'audit' && (
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-lg font-semibold text-(--color-text)">{t('dashboard.audit.title')}</h2>
          <AuditLogPanel sessionReady={sessionReady} refreshKey={auditRefreshKey} />
        </div>
      )}
    </DashboardLayout>
  )
}
