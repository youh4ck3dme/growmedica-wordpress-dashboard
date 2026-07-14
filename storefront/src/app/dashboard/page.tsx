import DashboardShell from '@/components/dashboard/agent/DashboardShell'
import { getDashboardMode, getDashboardUrl } from '@/lib/dashboard'

export default function DashboardPage() {
  const mode = getDashboardMode()
  const dashboardUrl = getDashboardUrl()
  const agentSecret = process.env.DASHBOARD_AGENT_SECRET?.trim() ?? ''

  if (mode === 'iframe' && !dashboardUrl) {
    return (
      <div
        className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-(--color-surface) px-6 text-center"
        data-testid="dashboard-unconfigured"
      >
        <h1 className="text-xl font-semibold text-(--color-text)">Dashboard nie je nakonfigurovaný</h1>
        <p className="max-w-md text-sm text-(--color-text-muted)">
          Nastavte premennú{' '}
          <code className="rounded bg-(--color-border)/40 px-1.5 py-0.5 text-xs">
            NEXT_PUBLIC_DASHBOARD_URL
          </code>{' '}
          na WordPress admin URL, napr.{' '}
          <code className="rounded bg-(--color-border)/40 px-1.5 py-0.5 text-xs">
            https://cms.growmedica.sk/wp-admin
          </code>
          , alebo prepnite na{' '}
          <code className="rounded bg-(--color-border)/40 px-1.5 py-0.5 text-xs">
            NEXT_PUBLIC_DASHBOARD_MODE=agentic
          </code>
          .
        </p>
      </div>
    )
  }

  return <DashboardShell mode={mode} dashboardUrl={dashboardUrl} agentSecret={agentSecret} />
}
