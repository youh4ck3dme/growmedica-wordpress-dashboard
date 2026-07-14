'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, Search, ShoppingBag } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import Logo from '@/components/ui/Logo'
import MobileNav from '@/components/layout/MobileNav'
import HeaderMegaMenu, { type MegaMenuCategory } from '@/components/layout/HeaderMegaMenu'
import { StorefrontThemeSwitcher } from '@/components/theme/StorefrontThemeSwitcher'
import { ThemeSearch } from '@/components/ui/ThemeSearch'
import { useStorefrontTheme } from '@/components/theme/StorefrontThemeProvider'
import { PRIMARY_NAV_LINKS } from '@/lib/navigation/primary-nav'
import { shouldHideThemeSwitcher } from '@/lib/theme/storefront-theme'
import { cn } from '@/lib/utils'

interface GlassNavbarProps {
  megaMenuCategories?: MegaMenuCategory[]
}

export default function GlassNavbar({ megaMenuCategories = [] }: GlassNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  const categoryLinks = megaMenuCategories.map((c) => ({
    href: c.href,
    label: c.menuLabel,
  }))

  useEffect(() => {
    async function fetchCartCount() {
      try {
        const res = await fetch('/api/cart')
        if (res.ok) {
          const data = (await res.json()) as { count?: number }
          if (data.count !== undefined) setCartCount(data.count)
        }
      } catch {
        /* silent */
      }
    }
    fetchCartCount()

    function handleCartCountUpdate(e: Event) {
      setCartCount((e as CustomEvent<number>).detail)
    }
    window.addEventListener('cart-count-updated', handleCartCountUpdate)

    function handleScroll() {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('cart-count-updated', handleCartCountUpdate)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const navLinkClass =
    'px-2.5 xl:px-3 py-2 text-sm font-semibold text-(--color-text) hover:text-(--color-primary) transition-colors uppercase tracking-wider relative group whitespace-nowrap'

  const showThemeSwitcher = !shouldHideThemeSwitcher()
  const { theme } = useStorefrontTheme()

  return (
    <>
      <header
        data-site-header
        className={cn(
          'glass-navbar site-header w-full noor-header-shell theme-transition',
          scrolled && 'glass-navbar--scrolled',
        )}
      >
        <Container>
          <div className="noor-header-grid flex h-[60px] items-center justify-between gap-4">
            <div className="noor-header-left flex items-center min-w-0">
              <button
                id="mobile-nav-toggle"
                type="button"
                className="glass-navbar__action lg:hidden text-(--color-text)"
                onClick={() => setMobileOpen(true)}
                aria-label="Otvoriť hlavné menu"
                aria-expanded={mobileOpen}
              >
                <Menu className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>

            <Link
              href="/"
              id="site-logo"
              className="noor-header-center shrink-0 site-logo-mark"
              aria-label="GrowMedica.sk — domov"
            >
              <Logo iconSize={32} />
            </Link>

            <nav
              className="noor-header-nav hidden lg:flex items-center gap-0 min-w-0 flex-1 justify-center flex-wrap"
              aria-label="Hlavná navigácia"
            >
              {PRIMARY_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={navLinkClass}
                  style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.06em', fontSize: '0.72rem' }}
                >
                  {link.label}
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-(--color-primary) scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </Link>
              ))}

              {megaMenuCategories.length > 0 && (
                <HeaderMegaMenu categories={megaMenuCategories} />
              )}
            </nav>

            <div className="noor-header-right flex items-center gap-0.5 shrink-0">
              {showThemeSwitcher && <StorefrontThemeSwitcher />}
              <ThemeSearch
                className={`glass-navbar__action${theme === 'noor' ? '' : ' lg:hidden'}`}
                aria-label="Vyhľadávanie"
              >
                <Search className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              </ThemeSearch>

              <Link
                href="/kosik"
                id="cart-button"
                className="glass-navbar__action relative"
                aria-label={`Nákupný košík${cartCount > 0 ? `, ${cartCount} položiek` : ''}`}
              >
                <ShoppingBag className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white bg-(--color-primary)"
                    aria-hidden="true"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </Container>
      </header>

      <MobileNav
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        primaryLinks={PRIMARY_NAV_LINKS}
        categoryLinks={categoryLinks}
      />
    </>
  )
}
