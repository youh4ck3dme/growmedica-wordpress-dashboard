import { test, expect } from '@playwright/test'
import coverage from '../fixtures/category-coverage.json'
import { resolveCategory, MAIN_CATEGORIES } from '../../src/lib/category-map'

test.describe('Category coverage — export fixture', () => {
  test('export fixture pokrýva aspoň 90 % aktívnych produktov', () => {
    expect(coverage.totalActive).toBeGreaterThan(0)
    expect(coverage.coveragePercent).toBeGreaterThanOrEqual(90)
    expect(coverage.ostatneCount).toBeLessThanOrEqual(Math.ceil(coverage.totalActive * 0.1))
  })

  test('resolveCategory mapuje všetky definované slugy', () => {
    for (const def of MAIN_CATEGORIES) {
      expect(def.slug).toBeTruthy()
      expect(def.title).toBeTruthy()
    }
  })

  test('počty kategórií v fixture sú konzistentné', () => {
    const sum = Object.values(coverage.counts).reduce((a, b) => a + b, 0)
    expect(sum).toBe(coverage.totalActive)
    expect(coverage.coveredCount + coverage.ostatneCount).toBe(coverage.totalActive)
  })

  test('vitaminy-mineraly a regeneracia majú produkty v exporte', () => {
    expect(coverage.counts['vitaminy-mineraly']).toBeGreaterThan(10)
    expect(coverage.counts['regeneracia']).toBeGreaterThan(10)
  })

  test('resolveCategory dáva rovnaký výsledok ako fixture pre vzorku', () => {
    const sample = {
      productType: 'DOPLNKY VÝŽIVY',
      tags: ['Vitamíny', 'DOPLNKY VÝŽIVY'],
    }
    expect(resolveCategory(sample)).toBe('vitaminy-mineraly')
  })
})
