'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { LEGACY_NEXUS_ADMIN_URL } from '@/lib/dashboard'

export type DashboardView =
  | 'home'
  | 'products'
  | 'product-detail'
  | 'orders'
  | 'inventory'
  | 'agent'
  | 'audit'

type DashboardNavProps = {
  active: DashboardView
  onNavigate: (view: DashboardView) => void
}

const NAV_ITEMS = [
  { id: 'home' as const, labelKey: 'dashboard.nav.home' as const },
  { id: 'products' as const, labelKey: 'dashboard.nav.products' as const },
  { id: 'orders' as const, labelKey: 'dashboard.nav.orders' as const },
  { id: 'inventory' as const, labelKey: 'dashboard.nav.inventory' as const },
  { id: 'agent' as const, labelKey: 'dashboard.nav.agent' as const },
  { id: 'audit' as const, labelKey: 'dashboard.nav.audit' as const },
]

export default function DashboardNav({ active, onNavigate }: DashboardNavProps) {
  const { t } = useLocale()

  return (
    <nav className="flex flex-col gap-1" data-testid="dashboard-nav">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onNavigate(item.id)}
          className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
            active === item.id
              ? 'bg-(--color-primary) text-white'
              : 'text-(--color-text-muted) hover:bg-(--color-border)/30 hover:text-(--color-text)'
          }`}
          data-testid={`dashboard-nav-${item.id}`}
        >
          {t(item.labelKey)}
        </button>
      ))}
      <div className="mt-4 border-t border-(--color-border) pt-4">
        <Link
          href={LEGACY_NEXUS_ADMIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block px-3 py-2 text-xs text-(--color-text-muted) hover:text-(--color-text)"
        >
          {t('dashboard.legacyNexus')}
        </Link>
      </div>
    </nav>
  )
}

type DashboardLayoutProps = {
  activeView: DashboardView
  onNavigate: (view: DashboardView) => void
  children: ReactNode
}

export function DashboardLayout({ activeView, onNavigate, children }: DashboardLayoutProps) {
  const { t } = useLocale()

  return (
    <div className="flex h-dvh w-full bg-(--color-surface)" data-testid="dashboard-shell">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-(--color-border) p-4 md:flex">
        <div className="mb-6">
          <h1 className="text-base font-semibold text-(--color-text)">{t('dashboard.title')}</h1>
          <p className="text-xs text-(--color-text-muted)">{t('dashboard.subtitle')}</p>
        </div>
        <DashboardNav active={activeView} onNavigate={onNavigate} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-(--color-border) px-4 py-3 md:hidden">
          <h1 className="text-base font-semibold text-(--color-text)">{t('dashboard.title')}</h1>
          <select
            value={activeView}
            onChange={(e) => onNavigate(e.target.value as DashboardView)}
            className="rounded border border-(--color-border) bg-(--color-background) px-2 py-1 text-sm"
            data-testid="dashboard-nav-mobile"
          >
            {NAV_ITEMS.map((item) => (
              <option key={item.id} value={item.id}>
                {t(item.labelKey)}
              </option>
            ))}
          </select>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
