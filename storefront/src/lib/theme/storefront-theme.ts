export type StorefrontTheme = 'classic' | 'noor'

export const STORAGE_KEY = 'growmedica-storefront-theme'
export const THEME_CHANGED_EVENT = 'storefront-theme-changed'
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function getDefaultTheme(): StorefrontTheme {
  return process.env.NEXT_PUBLIC_DEFAULT_THEME === 'noor' ? 'noor' : 'classic'
}

export const DEFAULT_THEME: StorefrontTheme = getDefaultTheme()

export function shouldHideThemeSwitcher(): boolean {
  return process.env.NEXT_PUBLIC_HIDE_THEME_SWITCHER === '1'
}

/** Demo deploy: NOOR is forced and user preference in localStorage is ignored. */
export function isLockedNoorDemo(): boolean {
  return getDefaultTheme() === 'noor' && shouldHideThemeSwitcher()
}

export function resolveInitialTheme(stored: StorefrontTheme | null): StorefrontTheme {
  const defaultTheme = getDefaultTheme()
  if (isLockedNoorDemo()) return defaultTheme
  if (stored && isStorefrontTheme(stored)) return stored
  return defaultTheme
}

export function getThemeBootstrapScript(): string {
  const defaultTheme = getDefaultTheme()
  const lockedDemo = isLockedNoorDemo()

  return `(function () {
  try {
    var key = '${STORAGE_KEY}';
    var defaultTheme = '${defaultTheme}';
    var lockedDemo = ${lockedDemo ? 'true' : 'false'};
    var html = document.documentElement;
    var ssrTheme = html.getAttribute('data-storefront-theme');
    var stored = lockedDemo ? null : localStorage.getItem(key);
    var preferred = lockedDemo
      ? defaultTheme
      : (stored === 'noor' || stored === 'classic' ? stored : (ssrTheme || defaultTheme));

    if (!ssrTheme || lockedDemo) {
      html.setAttribute('data-storefront-theme', preferred);
    }
  } catch (e) {
    document.documentElement.setAttribute('data-storefront-theme', '${defaultTheme}');
  }
})();`
}

export function setThemeCookie(theme: StorefrontTheme): void {
  if (typeof document === 'undefined') return
  document.cookie = `${STORAGE_KEY}=${theme};path=/;max-age=${THEME_COOKIE_MAX_AGE};SameSite=Lax`
}

export function isStorefrontTheme(value: unknown): value is StorefrontTheme {
  return value === 'classic' || value === 'noor'
}

export function readStoredTheme(): StorefrontTheme | null {
  if (typeof window === 'undefined') return null
  if (isLockedNoorDemo()) return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isStorefrontTheme(stored) ? stored : null
  } catch {
    return null
  }
}

export function getDocumentTheme(): StorefrontTheme {
  if (typeof document === 'undefined') return DEFAULT_THEME

  const attr = document.documentElement.getAttribute('data-storefront-theme')
  return isStorefrontTheme(attr) ? attr : DEFAULT_THEME
}

export function applyThemeToDocument(theme: StorefrontTheme): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-storefront-theme', theme)
}
