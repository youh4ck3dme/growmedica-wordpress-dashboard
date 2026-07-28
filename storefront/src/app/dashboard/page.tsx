import DashboardFrame from '@/components/dashboard/DashboardFrame'
import DashboardShell from '@/components/dashboard/agent/DashboardShell'
import {
  getDashboardMode,
  getDashboardUrl,
  SALES_CRM_DASHBOARD_URL,
} from '@/lib/dashboard'

export default function DashboardPage() {
  const mode = getDashboardMode()
  const dashboardUrl = getDashboardUrl()

  if (mode === 'iframe') {
    if (!dashboardUrl) {
      return (
        <div
          className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-(--color-surface) px-6 text-center"
          data-testid="dashboard-unconfigured"
        >
          <h1 className="text-xl font-semibold text-(--color-text)">
            Dashboard nie je nakonfigurovaný
          </h1>
          <p className="max-w-md text-sm text-(--color-text-muted)">
            Nastavte{' '}
            <code className="rounded bg-(--color-border)/40 px-1.5 py-0.5 text-xs">
              NEXT_PUBLIC_DASHBOARD_URL
            </code>{' '}
            na Sales CRM (napr.{' '}
            <code className="rounded bg-(--color-border)/40 px-1.5 py-0.5 text-xs">
              {SALES_CRM_DASHBOARD_URL}
            </code>
            ).
          </p>
          <a
            href={SALES_CRM_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary mt-2"
            data-testid="dashboard-direct-link"
          >
            Otvoriť Sales CRM priamo
          </a>
        </div>
      )
    }

    return <DashboardFrame src={dashboardUrl} title="GrowMedica Sales CRM" />
  }

  return <DashboardShell />
}
