import { test, expect } from '@playwright/test'
import type { WooProduct } from '@/lib/wordpress/types'
import {
  isWooBundleProduct,
  pickMixedNonBundleProducts,
} from '@/lib/wordpress/products'

function wooStub(partial: Partial<WooProduct> & Pick<WooProduct, 'id' | 'slug' | 'name'>): WooProduct {
  return {
    permalink: '/',
    type: 'simple',
    status: 'publish',
    description: '',
    short_description: '',
    sku: '',
    price: '10',
    regular_price: '10',
    sale_price: '',
    on_sale: false,
    stock_status: 'instock',
    stock_quantity: 1,
    categories: [],
    tags: [],
    images: [],
    attributes: [],
    meta_data: [],
    date_modified_gmt: '2026-01-01T00:00:00Z',
    ...partial,
  }
}

test.describe('homepage featured mix (no balíčky)', () => {
  test('isWooBundleProduct detects slug, category and title packs', () => {
    expect(
      isWooBundleProduct(
        wooStub({
          id: 1,
          slug: 'balicek-senior-pohyb',
          name: 'Balíček: Senior pohyb',
        }),
      ),
    ).toBe(true)

    expect(
      isWooBundleProduct(
        wooStub({
          id: 2,
          slug: 'beauty-care-pack',
          name: 'Beauty Care Pack',
          categories: [{ id: 9, name: 'Balíčky zdravia', slug: 'balicky-zdravia' }],
        }),
      ),
    ).toBe(true)

    expect(
      isWooBundleProduct(
        wooStub({
          id: 3,
          slug: 'mycomedica-bio-polyporus-100-g',
          name: 'Mycomedica BIO Polyporus 100 g',
          categories: [{ id: 1, name: 'Sušené huby', slug: 'susene-huby' }],
        }),
      ),
    ).toBe(false)
  })

  test('pickMixedNonBundleProducts excludes packs and diversifies categories + brands', () => {
    const pool = [
      wooStub({
        id: 1,
        slug: 'balicek-senior-pohyb',
        name: 'Balíček: Senior pohyb',
        categories: [{ id: 1, name: 'Kosti', slug: 'kosti-klby-a-svaly' }],
        meta_data: [{ key: '_shopify_vendor', value: 'GrowMedica' }],
      }),
      wooStub({
        id: 2,
        slug: 'mycomedica-bio-polyporus-100-g',
        name: 'Polyporus',
        categories: [{ id: 2, name: 'Huby', slug: 'susene-huby' }],
        meta_data: [{ key: '_shopify_vendor', value: 'MycoMedica' }],
      }),
      wooStub({
        id: 3,
        slug: 'energy-serum',
        name: 'Energy serum',
        categories: [{ id: 5, name: 'Krása', slug: 'krasa' }],
        meta_data: [{ key: '_shopify_vendor', value: 'Energy' }],
      }),
      wooStub({
        id: 4,
        slug: 'zeen-collagen',
        name: 'Zeen Collagen',
        categories: [{ id: 4, name: 'Kolagén', slug: 'kolagen' }],
        meta_data: [{ key: '_shopify_vendor', value: 'Zeen' }],
      }),
      wooStub({
        id: 5,
        slug: 'energy-cream',
        name: 'Energy cream',
        categories: [{ id: 6, name: 'Denné krémy', slug: 'denne-kremy' }],
        meta_data: [{ key: '_shopify_vendor', value: 'Energy' }],
      }),
      wooStub({
        id: 6,
        slug: 'calivita-noni',
        name: 'Noni',
        categories: [{ id: 7, name: 'Detox', slug: 'detox' }],
        meta_data: [{ key: '_shopify_vendor', value: 'CaliVita' }],
      }),
    ]

    const mixed = pickMixedNonBundleProducts(pool, 4)
    expect(mixed).toHaveLength(4)
    expect(mixed.every((p) => !p.slug.startsWith('balicek-'))).toBe(true)
    // Energy cream is deferred so brands stay mixed in the first picks
    expect(mixed.map((p) => p.slug)).toEqual([
      'mycomedica-bio-polyporus-100-g',
      'energy-serum',
      'zeen-collagen',
      'calivita-noni',
    ])
  })
})
