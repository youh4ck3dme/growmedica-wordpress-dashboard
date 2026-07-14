import type { Page } from '@playwright/test'

function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return null
  const [, r, g, b] = match
  return (
    '#' +
    [r, g, b]
      .map((v) => parseInt(v, 10).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

export async function getCssVar(page: Page, name: string): Promise<string> {
  return page.evaluate((varName) => {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  }, name)
}

export async function getElementBackgroundHex(
  page: Page,
  selector: string
): Promise<string | null> {
  const rgb = await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    return getComputedStyle(el).backgroundColor
  }, selector)
  if (!rgb) return null
  return rgbToHex(rgb)
}
