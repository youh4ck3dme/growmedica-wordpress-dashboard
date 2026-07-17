/** Category handles with a shipped WebP hero banner in /public/images/mega-menu/ */
export const MEGA_MENU_BANNER_HANDLES = [
  // Legacy MainCategory SEO slugs
  'vitaminy-mineraly',
  'proteiny',
  'imunita',
  'srdce-cievy',
  'regeneracia',
  'sportova-vyziva',
  'travenie',
  'klby-pohyb',
  'zdrave-potraviny',
  'krasa-pokozka',
  'aminokyseliny',
  'detox-pecen',
  'spanok-stres',
  'specialna-vyziva',
  // Synthetic SK navigation roots without a matching Woo category image.
  'zdravotne-riesenia',
  'mykologicke-produkty',
] as const

export type MegaMenuBannerHandle = (typeof MEGA_MENU_BANNER_HANDLES)[number]

export function getMegaMenuBannerSrc(handle: string): string | null {
  if ((MEGA_MENU_BANNER_HANDLES as readonly string[]).includes(handle)) {
    return `/images/mega-menu/${handle}.webp`
  }
  return null
}

export function hasMegaMenuBanner(handle: string): handle is MegaMenuBannerHandle {
  return getMegaMenuBannerSrc(handle) !== null
}
