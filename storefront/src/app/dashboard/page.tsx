import DashboardShell from '@/components/dashboard/agent/DashboardShell'
import {
  LEGACY_NEXUS_ADMIN_URL,
  NEXUS_DASHBOARD_IFRAME_URL,
  getDashboardMode,
  getDashboardUrl,
} from '@/lib/dashboard'

function LegacyNexusLink({ className = '' }: { className?: string }) {
  return (
    <a
      href={LEGACY_NEXUS_ADMIN_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn btn-secondary text-xs ${className}`.trim()}
      data-testid="dashboard-legacy-nexus-link"
    >
      Nexus admin (nový tab)
    </a>
  )
}

export default function DashboardPage() {
  const mode = getDashboardMode()
  const dashboardUrl = getDashboardUrl()

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
          na Lovable Nexus admin URL, napr.{' '}
          <code className="rounded bg-(--color-border)/40 px-1.5 py-0.5 text-xs">
            {NEXUS_DASHBOARD_IFRAME_URL}
          </code>
          , alebo prepnite na{' '}
          <code className="rounded bg-(--color-border)/40 px-1.5 py-0.5 text-xs">
            NEXT_PUBLIC_DASHBOARD_MODE=agentic
          </code>
          .
        </p>
        <LegacyNexusLink className="mt-2" />
      </div>
    )
  }

  return <DashboardShell mode={mode} dashboardUrl={dashboardUrl} />
}
