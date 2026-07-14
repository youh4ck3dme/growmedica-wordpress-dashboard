import DashboardFrame from '@/components/dashboard/DashboardFrame'
import { LEGACY_NEXUS_ADMIN_URL, NEXUS_DASHBOARD_IFRAME_URL, getDashboardUrl } from '@/lib/dashboard'

const isDev = process.env.NODE_ENV === 'development'

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
  const dashboardUrl = getDashboardUrl()

  if (!dashboardUrl) {
    return (
      <div
        className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-(--color-surface) px-6 text-center"
        data-testid="dashboard-unconfigured"
      >
        <h1 className="text-xl font-semibold text-(--color-text)">Dashboard nie je nakonfigurovaný</h1>
        <p className="max-w-md text-sm text-(--color-text-muted)">
          Nastavte{' '}
          <code className="rounded bg-(--color-border)/40 px-1.5 py-0.5 text-xs">
            NEXT_PUBLIC_DASHBOARD_URL
          </code>{' '}
          na Lovable Nexus admin, napr.{' '}
          <code className="rounded bg-(--color-border)/40 px-1.5 py-0.5 text-xs">
            {NEXUS_DASHBOARD_IFRAME_URL}
          </code>
          . WordPress CMS beží na{' '}
          <code className="rounded bg-(--color-border)/40 px-1.5 py-0.5 text-xs">
            cms.growmedica.cz/wp-admin
          </code>{' '}
          (nie v iframe).
        </p>
        <LegacyNexusLink className="mt-2" />
      </div>
    )
  }

  return (
    <>
      {isDev && (
        <a
          href={dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 z-50 rounded-full border border-(--color-border) bg-(--color-surface)/95 px-4 py-2 text-xs font-medium text-(--color-text-muted) shadow-sm backdrop-blur hover:text-(--color-text)"
          data-testid="dashboard-dev-direct-link"
        >
          Dev: Nexus admin priamo
        </a>
      )}
      <DashboardFrame src={dashboardUrl} title="GrowMedica Nexus Dashboard" />
    </>
  )
}