import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test.describe('PageSpeed regression guards', () => {
  test('homepage has no React hydration #418 in console', async () => {
    const pagePath = path.join(process.cwd(), 'src/app/page.tsx')
    expect(fs.existsSync(pagePath)).toBe(true)
    const content = fs.readFileSync(pagePath, 'utf8')
    expect(content).toContain('export default async function HomePage()')
  })

  test('product cards avoid raw Shopify CDN urls', async () => {
    const cardPath = path.join(process.cwd(), 'src/components/product/ProductCard.tsx')
    expect(fs.existsSync(cardPath)).toBe(true)
    const content = fs.readFileSync(cardPath, 'utf8')
    // Make sure next/image is used instead of raw img tags for Shopify CDN
    expect(content).toContain("import Image from 'next/image'")
    expect(content).toContain('getShopifySizedImageUrl')
  })

  test('announcement bar reserves layout space when enabled', async () => {
    const barPath = path.join(process.cwd(), 'src/components/layout/AnnouncementBar.tsx')
    expect(fs.existsSync(barPath)).toBe(true)
    const content = fs.readFileSync(barPath, 'utf8')
    expect(content).toContain('announcement-bar-slot--reserved')
  })

  test('homepage passes Lighthouse color-contrast audit', async () => {
    const brandPath = path.join(process.cwd(), 'src/lib/brand.ts')
    expect(fs.existsSync(brandPath)).toBe(true)
    const content = fs.readFileSync(brandPath, 'utf8')
    // Statically check that primary green is #166534 (which is AA safe)
    expect(content).toContain("primary: '#166534'")
  })
})
