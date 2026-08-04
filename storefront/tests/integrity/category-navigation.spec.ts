import { test, expect } from '@playwright/test'
import { menuData } from '../../src/data/menuData'
import type { MenuCategory } from '../../src/types/menu'

const CATEGORY_URL_RE = /^https:\/\/www\.growmedica\.cz\/kategorie\//
const LINK_URL_RE = /^https:\/\/www\.growmedica\.cz\//

test.describe('Kategórie — dátová integrita (menuData)', () => {
  test('každá top-level kategória má platné id/name/slug a unikátne id', () => {
    const ids = new Set<string>()
    for (const cat of menuData.categories) {
      expect(cat.id).toBeTruthy()
      expect(cat.name).toBeTruthy()
      expect(cat.slug).toMatch(CATEGORY_URL_RE)
      expect(ids.has(cat.id)).toBe(false)
      ids.add(cat.id)
    }
  })

  test('každá hasMegaMenu kategória má aspoň 1 stĺpec s platnými položkami', () => {
    for (const cat of menuData.categories) {
      if (!cat.hasMegaMenu) continue
      expect(cat.columns && cat.columns.length).toBeGreaterThan(0)
      for (const col of cat.columns ?? []) {
        expect(col.title).toBeTruthy()
        expect(col.items.length).toBeGreaterThan(0)
        for (const item of col.items) {
          expect(item.name).toBeTruthy()
          expect(item.link).toMatch(CATEGORY_URL_RE)
        }
      }
    }
  })

  test('sekundárne odkazy majú platný name/slug', () => {
    for (const sec of menuData.secondaryLinks ?? []) {
      expect(sec.name).toBeTruthy()
      expect(sec.slug).toMatch(LINK_URL_RE)
    }
  })
})

test.describe('Kategórie — header UI (GrowMedicaHeader)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  for (const cat of menuData.categories as MenuCategory[]) {
    test(`kategória "${cat.name}" je viditeľná so správnym href`, async ({ page }) => {
      const nav = page.getByTestId('category-nav')
      const link = nav.getByRole('link', { name: cat.name, exact: true })
      await expect(link).toBeVisible()
      await expect(link).toHaveAttribute('href', cat.slug)
    })

    if (cat.hasMegaMenu && cat.columns) {
      test(`mega menu "${cat.name}" zobrazí všetky stĺpce a položky`, async ({ page }) => {
        const nav = page.getByTestId('category-nav')
        const trigger = nav.getByRole('link', { name: cat.name, exact: true })
        await trigger.hover()

        for (const col of cat.columns ?? []) {
          if (col.href) {
            const titleLink = nav.getByRole('link', { name: col.title, exact: true })
            await expect(titleLink).toBeVisible()
            await expect(titleLink).toHaveAttribute('href', col.href)
          } else {
            await expect(nav.getByText(col.title, { exact: true })).toBeVisible()
          }
          for (const item of col.items) {
            const itemLink = nav.getByRole('link', { name: item.name, exact: true })
            await expect(itemLink).toBeVisible()
            await expect(itemLink).toHaveAttribute('href', item.link)
          }
        }
      })
    }
  }

  for (const sec of menuData.secondaryLinks ?? []) {
    test(`sekundárny odkaz "${sec.name}" je viditeľný so správnym href`, async ({ page }) => {
      const nav = page.getByTestId('category-nav')
      const link = nav.getByRole('link', { name: sec.name, exact: true })
      await expect(link).toBeVisible()
      await expect(link).toHaveAttribute('href', sec.slug)
    })
  }
})

test.describe('Kategórie — department tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('department tabs sú viditeľné so správnym názvom', async ({ page }) => {
    const tabs = page.getByTestId('department-tabs')
    await expect(tabs).toBeVisible()
    for (const dept of menuData.departments ?? []) {
      await expect(page.getByTestId(`department-tab-${dept.id}`)).toHaveText(dept.name)
    }
  })

  for (const dept of menuData.departments ?? []) {
    test(`klik na department tab "${dept.name}" zvýrazní jeho kategórie`, async ({ page }) => {
      const tab = page.getByTestId(`department-tab-${dept.id}`)
      await tab.click()

      const nav = page.getByTestId('category-nav')
      for (const cat of menuData.categories) {
        const link = nav.getByRole('link', { name: cat.name, exact: true })
        await expect(link).toBeVisible()
      }
    })
  }
})
