import DashboardFrame from '@/components/dashboard/DashboardFrame'
import { getDashboardUrl } from '@/lib/dashboard'

const NEXUS_ADMIN_LOGIN_URL = 'https://growmedica-nexus.lovable.app/admin/prihlasenie'
const isDev = process.env.NODE_ENV === 'development'

function NexusDirectLink({ className = '' }: { className?: string }) {
  return (
    <a
      href={NEXUS_ADMIN_LOGIN_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn btn-secondary ${className}`.trim()}
      data-testid="dashboard-nexus-direct-link"
    >
      Otvoriť Nexus priamo
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
          Nastavte premennú{' '}
          <code className="rounded bg-(--color-border)/40 px-1.5 py-0.5 text-xs">
            NEXT_PUBLIC_DASHBOARD_URL
          </code>{' '}
          vo Vercel projekte alebo v <code className="rounded bg-(--color-border)/40 px-1.5 py-0.5 text-xs">.env.local</code>.
        </p>
        <NexusDirectLink className="mt-2" />
      </div>
    )
  }

  return (
    <>
      {isDev && (
        <a
          href={NEXUS_ADMIN_LOGIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 z-50 rounded-full border border-(--color-border) bg-(--color-surface)/95 px-4 py-2 text-xs font-medium text-(--color-text-muted) shadow-sm backdrop-blur hover:text-(--color-text)"
          data-testid="dashboard-dev-nexus-link"
        >
          Dev: Nexus admin
        </a>
      )}
      <DashboardFrame src={dashboardUrl} />
    </>
  )
}
