'use client'

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import type { AgentAction } from '@/lib/dashboard-agent/types'
import AgentActionResults from '@/components/dashboard/agent/AgentActionResults'

export type AgentChatMessage = {
  role: 'user' | 'assistant'
  content: string
  actions?: AgentAction[]
}

type AgentPanelProps = {
  messages: AgentChatMessage[]
  isLoading?: boolean
  onSelectProduct?: (handle: string) => void
}

export default function AgentPanel({
  messages,
  isLoading = false,
  onSelectProduct,
}: AgentPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div
      ref={containerRef}
      className="flex min-h-[320px] max-h-[50vh] flex-col gap-3 overflow-y-auto rounded-lg border border-(--color-border) bg-(--color-surface) p-4"
      data-testid="dashboard-agent-panel"
    >
      {messages.length === 0 && (
        <p className="text-sm text-(--color-text-muted)">
          Vitajte v GrowMedica AI Command Bar. Zadajte príkaz alebo použite rýchlu akciu.
        </p>
      )}

      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={`max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
            message.role === 'user'
              ? 'ml-auto bg-(--color-primary) text-white'
              : 'mr-auto border border-(--color-border) bg-(--color-background) text-(--color-text)'
          }`}
          data-testid={message.role === 'user' ? 'dashboard-agent-user-message' : 'dashboard-agent-assistant-message'}
        >
          {message.content}
          {message.actions && message.actions.length > 0 && (
            <AgentActionResults actions={message.actions} onSelectProduct={onSelectProduct} />
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-(--color-text-muted)" data-testid="dashboard-agent-loading">
          <Loader2 className="h-4 w-4 animate-spin" />
          Spracovávam…
        </div>
      )}
    </div>
  )
}
