import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import { readGlobalsCss } from '../helpers/globals-css'

const REPO_ROOT = path.resolve(__dirname, '../../..')
const WISHLIST_BTN_PATH = path.join(REPO_ROOT, 'storefront/src/components/product/WishlistButton.tsx')
const CLIENT_SESSION_PATH = path.join(REPO_ROOT, 'storefront/src/lib/auth/client-session.ts')
const AUTH_CONSTANTS_PATH = path.join(REPO_ROOT, 'storefront/src/lib/auth/constants.ts')
const SESSION_PATH = path.join(REPO_ROOT, 'storefront/src/lib/auth/session.ts')
const LOGIN_ROUTE_PATH = path.join(REPO_ROOT, 'storefront/src/app/api/auth/login/route.ts')
const REGISTER_ROUTE_PATH = path.join(REPO_ROOT, 'storefront/src/app/api/auth/register/route.ts')
const LOGOUT_ROUTE_PATH = path.join(REPO_ROOT, 'storefront/src/app/api/auth/logout/route.ts')
const TOAST_PATH = path.join(REPO_ROOT, 'storefront/src/components/noor/ui/Toast.tsx')
const THEME_TOAST_PATH = path.join(REPO_ROOT, 'storefront/src/components/ui/ThemeToast.tsx')
const LOCALE_FILES = ['sk', 'cs', 'en', 'de'].map((locale) => ({
  locale,
  path: path.join(REPO_ROOT, `storefront/src/lib/i18n/locales/${locale}.json`),
}))

test.describe('Wishlist auth-gate — static integrity', () => {
  test('WishlistButton blocks toggle for logged-out users', () => {
    expect(existsSync(WISHLIST_BTN_PATH)).toBe(true)
    const content = readFileSync(WISHLIST_BTN_PATH, 'utf8')
    expect(content).toContain("isLoggedIn } from '@/lib/auth/client-session'")
    expect(content).toContain('if (!isLoggedIn())')
    expect(content).toContain("t('wishlist.loginRequiredTitle')")
    expect(content).toContain("router.push('/prihlasenie')")
    // Existing logged-in flow must still be intact (no regression)
    expect(content).toContain("localStorage.getItem('gm_wishlist')")
    expect(content).toContain("localStorage.setItem('gm_wishlist'")
  })

  test('client-safe isLoggedIn() reads the non-httpOnly flag cookie only', () => {
    expect(existsSync(CLIENT_SESSION_PATH)).toBe(true)
    const content = readFileSync(CLIENT_SESSION_PATH, 'utf8')
    expect(content).toContain("'use client'")
    expect(content).toContain("from '@/lib/auth/constants'")
    expect(content).not.toContain('next/headers')
  })

  test('cookie name constants are dependency-free (no next/headers import)', () => {
    expect(existsSync(AUTH_CONSTANTS_PATH)).toBe(true)
    const content = readFileSync(AUTH_CONSTANTS_PATH, 'utf8')
    expect(content).toContain('CUSTOMER_SESSION_COOKIE')
    expect(content).toContain('CUSTOMER_LOGGED_IN_COOKIE')
    expect(content).not.toContain('next/headers')
  })

  test('session.ts re-exports the flag cookie helpers', () => {
    const content = readFileSync(SESSION_PATH, 'utf8')
    expect(content).toContain('loggedInFlagCookieOptions')
    expect(content).toContain("from '@/lib/auth/constants'")
  })

  for (const [name, routePath] of [
    ['login', LOGIN_ROUTE_PATH],
    ['register', REGISTER_ROUTE_PATH],
  ] as const) {
    test(`${name} route sets the gm_customer_logged_in flag cookie`, () => {
      expect(existsSync(routePath)).toBe(true)
      const content = readFileSync(routePath, 'utf8')
      expect(content).toContain('CUSTOMER_LOGGED_IN_COOKIE')
      expect(content).toContain('loggedInFlagCookieOptions')
    })
  }

  test('logout route clears the gm_customer_logged_in flag cookie', () => {
    const content = readFileSync(LOGOUT_ROUTE_PATH, 'utf8')
    expect(content).toContain('CUSTOMER_LOGGED_IN_COOKIE')
    expect(content).toMatch(/maxAge:\s*0/)
  })

  test('Toast supports an optional action button', () => {
    const toastContent = readFileSync(TOAST_PATH, 'utf8')
    expect(toastContent).toContain('noor-toast__action')
    expect(toastContent).toContain('action?:')

    const themeToastContent = readFileSync(THEME_TOAST_PATH, 'utf8')
    expect(themeToastContent).toContain('action?:')
  })

  test('sticky header: backdrop-filter is isolated on ::before (WebKit sticky bug guard)', () => {
    const css = readGlobalsCss()
    const baseRuleMatch = css.match(/\.glass-navbar\s*\{([^}]+)\}/)
    expect(baseRuleMatch, '.glass-navbar base rule must exist').toBeTruthy()
    expect(baseRuleMatch![1]).not.toContain('backdrop-filter')

    const beforeRuleMatch = css.match(/\.glass-navbar::before\s*\{([^}]+)\}/)
    expect(beforeRuleMatch, '.glass-navbar::before rule must exist').toBeTruthy()
    expect(beforeRuleMatch![1]).toContain('backdrop-filter')
    expect(beforeRuleMatch![1]).toContain('position: absolute')
  })

  for (const { locale, path: localePath } of LOCALE_FILES) {
    test(`${locale}.json has wishlist login-gate strings`, () => {
      const json = JSON.parse(readFileSync(localePath, 'utf8'))
      expect(json['wishlist.loginRequiredTitle']).toBeTruthy()
      expect(json['wishlist.loginRequiredDescription']).toBeTruthy()
      expect(json['wishlist.loginAction']).toBeTruthy()
    })
  }
})
