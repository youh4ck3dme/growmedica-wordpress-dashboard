'use client'

import Link from 'next/link'
import { Suspense, useEffect } from 'react'
import Logo from '@/components/ui/Logo'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { StorefrontThemeSwitcher } from '@/components/theme/StorefrontThemeSwitcher'
import { ThemeSearch } from '@/components/ui/ThemeSearch'
import type { NavLinkItem } from '@/lib/navigation/primary-nav'
import { shouldHideThemeSwitcher } from '@/lib/theme/storefront-theme'

type MobileCategoryLink = NavLinkItem & { children?: MobileCategoryLink[] }

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  primaryLinks: NavLinkItem[]
  categoryLinks: MobileCategoryLink[]
}

export default function MobileNav({
  isOpen,
  onClose,
  primaryLinks,
  categoryLinks,
}: MobileNavProps) {
  const { t } = useLocale()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-90 bg-[#101615]/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <nav
        id="mobile-nav"
        className="fixed inset-y-0 left-0 z-100 flex w-72 flex-col bg-(--color-surface) shadow-xl"
        aria-label={t('aria.mobileNav')}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-(--color-border) p-4">
          <Link
            href="/"
            onClick={onClose}
            className="site-logo-mark shrink-0"
            aria-label={t('aria.home')}
          >
            <Logo iconSize={28} />
          </Link>

          <button
            onClick={onClose}
            className="btn btn-ghost p-2"
            aria-label={t('aria.closeMenu')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <Suspense fallback={null}>
              <LanguageSwitcher className="mb-4 w-full justify-center" />
            </Suspense>
            <ThemeSearch
              variant="pill"
              pillClassName="search-pill w-full text-left"
              aria-label={t('aria.searchProducts')}
            />
          </div>
          <ul className="space-y-1" data-testid="mobile-nav-primary">
            {primaryLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="mobile-nav-primary-link flex items-center px-3 py-3 text-base font-semibold text-(--color-text) rounded-lg hover:bg-(--color-primary-light) hover:text-(--color-primary-dark) transition-colors"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {categoryLinks.length > 0 && (
            <>
              <div className="my-4 border-t border-(--color-border) pt-4" role="presentation">
                <p
                  className="px-3 pb-2 text-xs font-semibold uppercase tracking-widest text-(--color-text-muted)"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {t('aria.shopByCategory')}
                </p>
              </div>
              <ul className="space-y-1" data-testid="mobile-nav-categories">
                {categoryLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="flex items-center px-3 py-2.5 text-sm font-semibold text-(--color-text) rounded-lg hover:bg-(--color-primary-light) hover:text-(--color-primary-dark) transition-colors"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {link.label}
                    </Link>
                    {link.children && link.children.length > 0 && (
                      <ul className="ml-2 mt-0.5 space-y-0.5 border-l border-(--color-border) pl-2">
                        {link.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={onClose}
                              className="flex items-center px-2 py-1.5 text-sm font-medium text-(--color-text-muted) rounded-lg hover:bg-(--color-primary-light) hover:text-(--color-primary-dark) transition-colors"
                              style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                              {child.label}
                            </Link>
                            {child.children && child.children.length > 0 && (
                              <ul className="ml-2 mt-0.5 space-y-0.5 border-l border-(--color-border) pl-2">
                                {child.children.map((grand) => (
                                  <li key={grand.href}>
                                    <Link
                                      href={grand.href}
                                      onClick={onClose}
                                      className="flex items-center px-2 py-1 text-xs font-medium text-(--color-text-muted) rounded-lg hover:bg-(--color-primary-light) hover:text-(--color-primary-dark) transition-colors"
                                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                                    >
                                      {grand.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="mobile-nav-footer shrink-0 border-t border-(--color-border) p-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3">
          {!shouldHideThemeSwitcher() && <StorefrontThemeSwitcher compact />}
          <p className="text-xs text-(--color-text-light)">© {new Date().getFullYear()} GrowMedica</p>
        </div>
      </nav>
    </>
  )
}
