import type { MainCategory } from '@/lib/category-map'

/** Category handles with a shipped WebP hero banner in /public/images/mega-menu/ */
export const MEGA_MENU_BANNER_HANDLES = [
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
] as const satisfies readonly MainCategory[]

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
