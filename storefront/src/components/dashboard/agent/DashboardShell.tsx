'use client'

import { type ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardFrame from '@/components/dashboard/DashboardFrame'
import AgentPanel, { type AgentChatMessage } from '@/components/dashboard/agent/AgentPanel'
import AuditLogPanel from '@/components/dashboard/agent/AuditLogPanel'
import CommandBar from '@/components/dashboard/agent/CommandBar'
import IntegrationStatus from '@/components/dashboard/agent/IntegrationStatus'
import { DASHBOARD_AGENT_SECRET_HEADER } from '@/lib/dashboard-agent/auth'
import { LEGACY_NEXUS_ADMIN_URL, type DashboardMode } from '@/lib/dashboard'
import type { AgentRunResult } from '@/lib/dashboard-agent/types'

type DashboardTab = 'agent' | 'wordpress'

type DashboardShellProps = {
  mode: DashboardMode
  dashboardUrl?: string
  agentSecret: string
}

const CONVERSATION_STORAGE_KEY = 'growmedica_dashboard_agent_conversation_id'

export default function DashboardShell({ mode, dashboardUrl, agentSecret }: DashboardShellProps) {
  const showAgent = mode === 'agentic' || mode === 'hybrid'
  const showWordpress = mode === 'iframe' || mode === 'hybrid'
  const [activeTab, setActiveTab] = useState<DashboardTab>(showAgent ? 'agent' : 'wordpress')
  const [messages, setMessages] = useState<AgentChatMessage[]>([])
  const [conversationId, setConversationId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [auditRefreshKey, setAuditRefreshKey] = useState(0)
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    const stored =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(CONVERSATION_STORAGE_KEY)?.trim() ?? ''
        : ''
    if (stored) {
      setConversationId(stored)
      return
    }
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `dash-${Math.random().toString(36).slice(2, 12)}`
    setConversationId(generated)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CONVERSATION_STORAGE_KEY, generated)
    }
  }, [])

  const runCommand = async (command: string) => {
    if (!agentSecret) {
      setAgentError('Chýba DASHBOARD_AGENT_SECRET v server env.')
      return
    }

    setAgentError(null)
    setMessages((current) => [...current, { role: 'user', content: command }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/dashboard/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [DASHBOARD_AGENT_SECRET_HEADER]: agentSecret,
        },
        body: JSON.stringify({
          command,
          conversation_id: conversationId || undefined,
        }),
      })

      const payload = (await response.json()) as AgentRunResult & { error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'Agent je dočasne nedostupný.')

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
      const message = error instanceof Error ? error.message : 'Nepodarilo sa spracovať príkaz.'
      setAgentError(message)
      setMessages((current) => [...current, { role: 'assistant', content: `❌ ${message}` }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-dvh w-full flex-col bg-(--color-surface)" data-testid="dashboard-shell">
      <header className="shrink-0 border-b border-(--color-border) px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-(--color-text)">GrowMedica Dashboard</h1>
            <p className="text-xs text-(--color-text-muted)">
              Mistral AI Command Bar · režim: <span className="font-medium">{mode}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={LEGACY_NEXUS_ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary text-xs"
              data-testid="dashboard-legacy-nexus-link"
            >
              Legacy Nexus admin
            </Link>
            {isDev && dashboardUrl && (
              <a
                href={dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary text-xs"
                data-testid="dashboard-dev-direct-link"
              >
                Dev: WP admin
              </a>
            )}
          </div>
        </div>

        {showAgent && showWordpress && (
          <div className="mt-3 flex gap-2" data-testid="dashboard-tabs">
            <TabButton
              active={activeTab === 'agent'}
              onClick={() => setActiveTab('agent')}
              testId="dashboard-tab-agent"
            >
              AI Agent
            </TabButton>
            <TabButton
              active={activeTab === 'wordpress'}
              onClick={() => setActiveTab('wordpress')}
              testId="dashboard-tab-wordpress"
            >
              WordPress admin
            </TabButton>
          </div>
        )}
      </header>

      {showAgent && (mode === 'agentic' || activeTab === 'agent') && (
        <main className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6">
          <IntegrationStatus agentSecret={agentSecret} />
          <CommandBar disabled={isLoading} onSubmit={runCommand} />
          {agentError && (
            <p className="text-sm text-red-600" data-testid="dashboard-agent-error">
              {agentError}
            </p>
          )}
          <AgentPanel messages={messages} isLoading={isLoading} />
          <AuditLogPanel agentSecret={agentSecret} refreshKey={auditRefreshKey} />
        </main>
      )}

      {showWordpress && (mode === 'iframe' || activeTab === 'wordpress') && (
        <main className="flex flex-1 flex-col overflow-hidden">
          {dashboardUrl ? (
            <DashboardFrame src={dashboardUrl} />
          ) : (
            <div
              className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center"
              data-testid="dashboard-unconfigured"
            >
              <h2 className="text-lg font-semibold text-(--color-text)">WordPress admin nie je nakonfigurovaný</h2>
              <p className="max-w-md text-sm text-(--color-text-muted)">
                Nastavte{' '}
                <code className="rounded bg-(--color-border)/40 px-1.5 py-0.5 text-xs">
                  NEXT_PUBLIC_DASHBOARD_URL
                </code>{' '}
                na WordPress admin URL.
              </p>
            </div>
          )}
        </main>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  testId: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-(--color-primary) text-white'
          : 'border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text)'
      }`}
      data-testid={testId}
    >
      {children}
    </button>
  )
}
