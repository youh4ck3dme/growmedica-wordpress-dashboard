/**
 * Vendor must never come from tags[0] (barcode noise).
 * Logic mirrors storefront/src/lib/wordpress/adapter.ts resolveWooVendor.
 * Run: yarn test:unit
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function metaString(product, key) {
  const entry = product.meta_data?.find((m) => m.key === key)
  if (entry == null || entry.value == null) return null
  const value = String(entry.value).trim()
  return value.length > 0 ? value : null
}

function normalizeVendorName(raw) {
  const value = String(raw).trim()
  if (!value) return 'GrowMedica'
  if (/^growmedica(\.sk|\.cz)?$/i.test(value)) return 'GrowMedica'
  return value
}

function resolveWooVendor(product) {
  const fromMeta =
    metaString(product, '_shopify_vendor') ||
    metaString(product, 'shopify_vendor') ||
    metaString(product, '_vendor')
  if (fromMeta) return normalizeVendorName(fromMeta)
  const brand = product.brands?.[0]?.name?.trim()
  if (brand) return normalizeVendorName(brand)
  return 'GrowMedica'
}

describe('resolveWooVendor', () => {
  it('prefers _shopify_vendor over tags', () => {
    const product = {
      tags: [{ name: '00037' }, { name: 'alpa' }],
      meta_data: [{ key: '_shopify_vendor', value: 'MYCOMEDICA' }],
    }
    assert.equal(resolveWooVendor(product), 'MYCOMEDICA')
  })

  it('normalizes GrowMedica.sk store vendor to GrowMedica', () => {
    assert.equal(
      resolveWooVendor({
        tags: [],
        meta_data: [{ key: '_shopify_vendor', value: 'GrowMedica.sk' }],
      }),
      'GrowMedica',
    )
  })

  it('does not use tags[0]', () => {
    assert.equal(resolveWooVendor({ tags: [{ name: '00037' }] }), 'GrowMedica')
  })

  it('uses brands when meta missing', () => {
    assert.equal(
      resolveWooVendor({ tags: [{ name: '00037' }], brands: [{ name: 'Calivita' }] }),
      'Calivita',
    )
  })
})

describe('adapter source contract', () => {
  it('adapter.ts uses resolveWooVendor and not tags[0] for vendor', () => {
    const src = readFileSync(
      resolve(import.meta.dirname, '../../src/lib/wordpress/adapter.ts'),
      'utf8',
    )
    assert.match(src, /resolveWooVendor/)
    assert.match(src, /_shopify_vendor/)
    assert.doesNotMatch(src, /vendor:\s*product\.tags\[0\]/)
    assert.match(src, /getDeepestVisibleProductType/)
  })

  it('Forma/Kategória and Výrobca facet lists are fully expanded', () => {
    const src = readFileSync(
      resolve(import.meta.dirname, '../../src/components/product/FilterableProductList.tsx'),
      'utf8',
    )
    assert.match(src, /Forma \/ Kategória/)
    assert.doesNotMatch(src, /max-h-48 overflow-y-auto/)
    assert.doesNotMatch(src, /max-h-40 overflow-y-auto/)
  })
})
