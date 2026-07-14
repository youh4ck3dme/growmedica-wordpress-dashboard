'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Container } from '@/components/ui/Container'
import Logo from '@/components/ui/Logo'
import MobileNav from './MobileNav'
import HeaderMegaMenu, { type MegaMenuCategory } from './HeaderMegaMenu'
import { StorefrontThemeSwitcher } from '@/components/theme/StorefrontThemeSwitcher'
import { ThemeSearch } from '@/components/ui/ThemeSearch'
import { useStorefrontTheme } from '@/components/theme/StorefrontThemeProvider'
import { PRIMARY_NAV_LINKS } from '@/lib/navigation/primary-nav'
import { shouldHideThemeSwitcher } from '@/lib/theme/storefront-theme'
import { Heart, User } from 'lucide-react'

interface HeaderProps {
  megaMenuCategories?: MegaMenuCategory[]
}

export default function Header({ megaMenuCategories = [] }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  const [wishlistCount, setWishlistCount] = useState(0)

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

    // Load initial wishlist count
    try {
      const stored = localStorage.getItem('gm_wishlist')
      if (stored) {
        setWishlistCount((JSON.parse(stored) as string[]).length)
      }
    } catch {
      /* silent */
    }

    function handleCartCountUpdate(e: Event) {
      setCartCount((e as CustomEvent<number>).detail)
    }
    window.addEventListener('cart-count-updated', handleCartCountUpdate)

    function handleWishlistUpdate(e: Event) {
      const wishlist = (e as CustomEvent<string[]>).detail
      if (wishlist) setWishlistCount(wishlist.length)
    }
    window.addEventListener('wishlist-updated', handleWishlistUpdate)

    function handleScroll() {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('cart-count-updated', handleCartCountUpdate)
      window.removeEventListener('wishlist-updated', handleWishlistUpdate)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const navLinkClass =
    'px-2.5 xl:px-3 py-2 text-sm font-semibold text-(--color-text) hover:text-(--color-primary) transition-colors uppercase tracking-wider relative group whitespace-nowrap'

  const showThemeSwitcher = !shouldHideThemeSwitcher()
  const { theme } = useStorefrontTheme()
  const searchButtonClass =
    'p-2 text-(--color-text-muted) hover:text-(--color-primary) transition-colors rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center'

  return (
    <>
      <header
        data-site-header
        className="site-header sticky top-0 z-30 w-full bg-(--color-surface) transition-shadow duration-200 noor-header-shell"
        style={{
          boxShadow: scrolled ? 'var(--header-shadow-scrolled, 0 1px 12px rgba(16, 22, 21, 0.08))' : 'var(--header-shadow, 0 1px 0 var(--color-border))',
        }}
      >
        <Container>
          <div className="noor-header-grid flex h-[60px] items-center justify-between gap-4">
            <div className="noor-header-left flex items-center min-w-0">
              <button
                id="mobile-nav-toggle"
                className="p-2 lg:hidden text-(--color-text) hover:text-(--color-primary) transition-colors"
                onClick={() => setMobileOpen(true)}
                aria-label="Otvoriť hlavné menu"
                aria-expanded={mobileOpen}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h16M4 12h16M4 17h16" />
                </svg>
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

            <nav className="noor-header-nav hidden lg:flex items-center gap-0 min-w-0 flex-1 justify-center flex-wrap" aria-label="Hlavná navigácia">
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

            <div className="noor-header-right flex items-center gap-1 shrink-0">
              {showThemeSwitcher && <StorefrontThemeSwitcher />}
              <ThemeSearch
                className={`${searchButtonClass}${theme === 'noor' ? '' : ' lg:hidden'}`}
              />

              {/* Wishlist Link */}
              <Link
                href="/oblubene"
                id="wishlist-button"
                className="p-2 text-(--color-text-muted) hover:text-(--color-primary) transition-colors rounded-lg relative"
                aria-label={`Obľúbené produkty${wishlistCount > 0 ? `, ${wishlistCount} položiek` : ''}`}
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold text-white bg-red-500"
                    aria-hidden="true"
                  >
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Profile/Customer Zone Link */}
              <Link
                href="/profil"
                id="profile-button"
                className="p-2 text-(--color-text-muted) hover:text-(--color-primary) transition-colors rounded-lg"
                aria-label="Klientska zóna"
              >
                <User className="h-5 w-5" />
              </Link>

              <Link
                href="/kosik"
                id="cart-button"
                className="p-2 text-(--color-text-muted) hover:text-(--color-primary) transition-colors rounded-lg relative"
                aria-label={`Nákupný košík${cartCount > 0 ? `, ${cartCount} položiek` : ''}`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                </svg>
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
