import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { shouldIncludeMegaMenuCollection } from '../../src/lib/catalog/nav-types.ts'

describe('shouldIncludeMegaMenuCollection', () => {
  it('keeps categories with products', () => {
    assert.equal(shouldIncludeMegaMenuCollection({ productCount: 1 }), true)
  })

  it('keeps parent categories with children even when their own count is zero', () => {
    assert.equal(
      shouldIncludeMegaMenuCollection({
        productCount: 0,
        children: [{}],
      }),
      true,
    )
  })

  it('drops empty leaf categories', () => {
    assert.equal(
      shouldIncludeMegaMenuCollection({
        productCount: 0,
        children: [],
      }),
      false,
    )
  })
})
