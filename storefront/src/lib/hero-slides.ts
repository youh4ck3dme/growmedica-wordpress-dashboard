/** Static homepage hero carousel — local generated assets (no text in images). */

export type HeroCopyKey = '1' | '2' | '3' | '4'

export type HeroSlideDef = {
  id: string
  imageUrl: string
  width: number
  height: number
  copyKey: HeroCopyKey
  ctaHref: string
}

export const HERO_SLIDES: HeroSlideDef[] = [
  {
    id: 'product-cluster',
    imageUrl: '/heroes/hero-01-product-cluster.png',
    width: 1536,
    height: 1024,
    copyKey: '1',
    ctaHref: '/#supplement-finder',
  },
  {
    id: 'lifestyle-green',
    imageUrl: '/heroes/hero-02-lifestyle-green.png',
    width: 1536,
    height: 1024,
    copyKey: '2',
    ctaHref: '/balicky',
  },
  {
    id: 'clinical',
    imageUrl: '/heroes/hero-03-clinical.png',
    width: 1536,
    height: 1024,
    copyKey: '3',
    ctaHref: '/o-nas',
  },
  {
    id: 'product-line',
    imageUrl: '/heroes/hero-04-product-line.png',
    width: 1536,
    height: 1024,
    copyKey: '4',
    ctaHref: '/produkty',
  },
]
