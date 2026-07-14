'use client'

import { FormEvent, useState } from 'react'
import { Loader2, Send } from 'lucide-react'

const QUICK_ACTIONS = [
  'Zobraz produkty',
  'Export CSV katalógu',
  'Stav integrácie',
  'Hromadná zmena cien o 5%',
] as const

type CommandBarProps = {
  disabled?: boolean
  onSubmit: (command: string) => void | Promise<void>
}

export default function CommandBar({ disabled = false, onSubmit }: CommandBarProps) {
  const [command, setCommand] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const value = command.trim()
    if (!value || disabled) return
    setCommand('')
    await onSubmit(value)
  }

  return (
    <div className="space-y-3" data-testid="dashboard-command-bar">
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            disabled={disabled}
            onClick={() => void onSubmit(action)}
            className="rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-xs font-medium text-(--color-text-muted) transition hover:border-(--color-primary) hover:text-(--color-text) disabled:opacity-50"
            data-testid={`dashboard-quick-action-${action.replace(/\s+/g, '-').toLowerCase()}`}
          >
            {action}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="flex gap-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Zadajte príkaz pre AI agenta…"
          disabled={disabled}
          className="flex-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:border-(--color-primary) focus:outline-none disabled:opacity-50"
          data-testid="dashboard-command-input"
        />
        <button
          type="submit"
          disabled={disabled || !command.trim()}
          className="btn btn-primary inline-flex items-center gap-2 px-4"
          data-testid="dashboard-command-submit"
        >
          {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Spustiť
        </button>
      </form>
    </div>
  )
}
