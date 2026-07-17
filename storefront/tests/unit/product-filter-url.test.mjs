import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildProductFilterSearchParams,
  parseProductFilterSearchParams,
  productFilterSearchParamsEqual,
} from '../../src/lib/product-filter-url.ts'

describe('product filter URL', () => {
  it('parses multi vendor/type/effect and sort', () => {
    const params = new URLSearchParams(
      'q=kolagen&vendor=ENERGY&vendor=ZEEN&type=Kolagén&effect=Imunita&sort=PRICE_ASC&priceMin=10&priceMax=50',
    )
    const state = parseProductFilterSearchParams(params)
    assert.equal(state.q, 'kolagen')
    assert.deepEqual(state.vendors, ['ENERGY', 'ZEEN'])
    assert.deepEqual(state.types, ['Kolagén'])
    assert.deepEqual(state.effects, ['Imunita'])
    assert.equal(state.sort, 'PRICE_ASC')
    assert.equal(state.priceMin, 10)
    assert.equal(state.priceMax, 50)
  })

  it('round-trips to stable query string', () => {
    const built = buildProductFilterSearchParams(
      {
        q: 'test',
        vendors: ['CALIVITA'],
        types: ['Vitamín C'],
        effects: ['Imunita', 'Detoxikácia'],
        sort: 'TITLE',
        priceMin: 5,
        priceMax: 40,
      },
      { priceLimits: { min: 0, max: 100 } },
    )
    const again = parseProductFilterSearchParams(built)
    assert.equal(again.q, 'test')
    assert.deepEqual(again.vendors, ['CALIVITA'])
    assert.deepEqual(again.types, ['Vitamín C'])
    assert.deepEqual(again.effects, ['Imunita', 'Detoxikácia'])
    assert.equal(again.sort, 'TITLE')
    assert.equal(again.priceMin, 5)
    assert.equal(again.priceMax, 40)
  })

  it('omits default sort and full price range', () => {
    const built = buildProductFilterSearchParams(
      {
        q: '',
        vendors: [],
        types: [],
        effects: [],
        sort: 'BEST_SELLING',
        priceMin: 0,
        priceMax: 100,
      },
      { priceLimits: { min: 0, max: 100 } },
    )
    assert.equal(built.toString(), '')
  })

  it('compares search params by serialized form', () => {
    const a = new URLSearchParams('vendor=ENERGY&effect=Imunita')
    const b = new URLSearchParams('vendor=ENERGY&effect=Imunita')
    const c = new URLSearchParams('vendor=ZEEN')
    assert.equal(productFilterSearchParamsEqual(a, b), true)
    assert.equal(productFilterSearchParamsEqual(a, c), false)
  })
})
