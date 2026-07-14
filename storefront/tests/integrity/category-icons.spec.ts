import { test, expect } from '@playwright/test'
import { getNavCategories } from '@/lib/category-map'

test.describe('Category icons — category-map', () => {
  test('všetky nav kategórie majú definovanú ikonku', () => {
    const categories = getNavCategories()

    expect(categories.length).toBeGreaterThanOrEqual(14)

    for (const def of categories) {
      expect(def.icon, `${def.slug} missing icon`).toBeTruthy()
      expect(def.icon!.length, `${def.slug} empty icon`).toBeGreaterThan(0)
    }
  })

  test('všetky nav kategórie majú popis pre kolekcie', () => {
    const categories = getNavCategories()

    for (const def of categories) {
      expect(def.description, `${def.slug} missing description`).toBeTruthy()
      expect(def.description!.trim().length, `${def.slug} description too short`).toBeGreaterThan(30)
    }
  })

  test('ikony nav kategórií sú unikátne', () => {
    const categories = getNavCategories()
    const icons = categories.map((c) => c.icon)
    const unique = new Set(icons)

    expect(unique.size).toBe(categories.length)
  })
})
