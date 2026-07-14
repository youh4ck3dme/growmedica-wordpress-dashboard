'use client'

import { FormEvent, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { useLocale } from '@/components/i18n/LocaleProvider'

type CommandBarProps = {
  disabled?: boolean
  onSubmit: (command: string) => void | Promise<void>
}

export default function CommandBar({ disabled = false, onSubmit }: CommandBarProps) {
  const { t } = useLocale()
  const [command, setCommand] = useState('')

  const quickActions = [
    { label: t('dashboard.quick.listProducts'), command: 'Zobraz produkty' },
    { label: t('dashboard.quick.exportCsv'), command: 'Export CSV katalógu' },
    { label: t('dashboard.quick.integrationStatus'), command: 'Stav integrácie' },
    { label: t('dashboard.quick.catalogSummary'), command: 'Súhrn katalógu' },
  ]

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
        {quickActions.map((action) => (
          <button
            key={action.command}
            type="button"
            disabled={disabled}
            onClick={() => void onSubmit(action.command)}
            className="rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-xs font-medium text-(--color-text-muted) transition hover:border-(--color-primary) hover:text-(--color-text) disabled:opacity-50"
            data-testid={`dashboard-quick-action-${action.command.replace(/\s+/g, '-').toLowerCase()}`}
          >
            {action.label}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="flex gap-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={t('dashboard.command.placeholder')}
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
          {t('dashboard.command.submit')}
        </button>
      </form>
    </div>
  )
}
