import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  getDeepestVisibleProductType,
  getProductEffectLabels,
  normalizeProductTypeFacet,
} from '../../src/lib/product-facets.ts'

describe('getProductEffectLabels', () => {
  it('maps known aliases to canonical Slovak effects and removes duplicates', () => {
    assert.deepEqual(
      getProductEffectLabels([
        'PODPORA IMUNITY',
        'obranyschopnosť',
        'spánok',
        'podpora spánku',
      ]),
      ['Imunita', 'Spánok a relax'],
    )
  })

  it('rejects catalog noise instead of guessing from arbitrary tags', () => {
    assert.deepEqual(
      getProductEffectLabels([
        '00037',
        '8594167655057',
        '135 BB / 18.75 OB',
        '160 ml',
        '2 ks',
        'calivita',
        'Mycomedica BIO Polyporus 100 g',
        'DOPLNKY VÝŽIVY',
        'najlepší vitamín D na imunitu',
      ]),
      [],
    )
  })

  it('returns canonical effects in stable taxonomy order', () => {
    assert.deepEqual(
      getProductEffectLabels(['ženské zdravie', 'pečeň', 'kĺby a svaly', 'trávenie']),
      ['Trávenie', 'Kĺby a svaly', 'Pečeň a žlčník', 'Ženské zdravie'],
    )
  })

  it('requires an exact normalized alias, not an SEO substring match', () => {
    assert.deepEqual(getProductEffectLabels(['podpora imunity pre deti']), [])
    assert.deepEqual(getProductEffectLabels(['podpora imunity']), ['Imunita'])
  })
})

describe('normalizeProductTypeFacet', () => {
  it('hides generic and empty product types', () => {
    for (const value of [
      '',
      '   ',
      'Product',
      'products',
      'Všetky produkty',
      'Nezaradené',
      'Uncategorized',
      'All Products',
    ]) {
      assert.equal(normalizeProductTypeFacet(value), null)
    }
  })

  it('keeps a trimmed real leaf category', () => {
    assert.equal(normalizeProductTypeFacet('  DOPLNKY VÝŽIVY  '), 'DOPLNKY VÝŽIVY')
  })

  it('falls back to the deepest valid parent when the leaf is generic', () => {
    assert.equal(
      getDeepestVisibleProductType(['Zdravie', 'DOPLNKY VÝŽIVY', 'Všetky produkty']),
      'DOPLNKY VÝŽIVY',
    )
    assert.equal(getDeepestVisibleProductType(['Nezaradené', 'Product']), '')
  })
})
