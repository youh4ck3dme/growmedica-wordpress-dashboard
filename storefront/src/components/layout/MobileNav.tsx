'use client'

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { useEffect } from 'react'
import Logo from '@/components/ui/Logo'
import { openPharmacistAssistant } from '@/lib/ai/pharmacist-assistant-events'
import { StorefrontThemeSwitcher } from '@/components/theme/StorefrontThemeSwitcher'
import { ThemeSearch } from '@/components/ui/ThemeSearch'
import type { NavLinkItem } from '@/lib/navigation/primary-nav'
import { shouldHideThemeSwitcher } from '@/lib/theme/storefront-theme'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  primaryLinks: NavLinkItem[]
  categoryLinks: NavLinkItem[]
}

export default function MobileNav({
  isOpen,
  onClose,
  primaryLinks,
  categoryLinks,
}: MobileNavProps) {
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
        className="fixed inset-0 z-[90] bg-[#101615]/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <nav
        id="mobile-nav"
        className="fixed inset-y-0 left-0 z-[100] flex w-72 flex-col bg-(--color-surface) shadow-xl"
        aria-label="Mobilná navigácia"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-(--color-border) p-4">
          <Link
            href="/"
            onClick={onClose}
            className="site-logo-mark shrink-0"
            aria-label="GrowMedica.sk — domov"
          >
            <Logo iconSize={28} />
          </Link>

          <button
            onClick={onClose}
            className="btn btn-ghost p-2"
            aria-label="Zatvoriť menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <ThemeSearch
              variant="pill"
              pillClassName="search-pill w-full text-left"
              aria-label="Vyhľadávanie produktov"
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
              <div
                className="my-4 border-t border-(--color-border) pt-4"
                role="presentation"
              >
                <p
                  className="px-3 pb-2 text-xs font-semibold uppercase tracking-widest text-(--color-text-muted)"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Nakupovať podľa kategórie
                </p>
              </div>
              <ul className="space-y-1" data-testid="mobile-nav-categories">
                {categoryLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="flex items-center px-3 py-2.5 text-sm font-medium text-(--color-text-muted) rounded-lg hover:bg-(--color-primary-light) hover:text-(--color-primary-dark) transition-colors"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="relative z-[1] shrink-0 border-t border-(--color-border) p-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3">
          <button
            type="button"
            className="assistant-mobile-trigger"
            data-testid="assistant-mobile-trigger"
            aria-label="Poradiť sa s lekárnikom"
            onClick={() => {
              openPharmacistAssistant()
              onClose()
            }}
          >
            <MessageCircle size={18} aria-hidden="true" />
            Poradiť sa s lekárnikom
          </button>
          {!shouldHideThemeSwitcher() && <StorefrontThemeSwitcher compact />}
          <p className="text-xs text-(--color-text-light)">© {new Date().getFullYear()} GrowMedica.sk</p>
        </div>
      </nav>
    </>
  )
}
