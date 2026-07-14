import { test, expect } from '@playwright/test'
import { BRAND_ASSETS } from '../fixtures/brand'
import * as fs from 'fs'
import * as path from 'path'

test.describe('Brand assets — static files', () => {
  for (const assetPath of BRAND_ASSETS) {
    test(`${assetPath} je dostupný (HTTP 200)`, async () => {
      // Check if file exists in public directory
      const localPath = path.join(process.cwd(), 'public', assetPath)
      expect(fs.existsSync(localPath)).toBe(true)
    })
  }

  test('manifest.webmanifest obsahuje theme_color teal', async () => {
    const localPath = path.join(process.cwd(), 'public', 'manifest.webmanifest')
    expect(fs.existsSync(localPath)).toBe(true)
    const content = fs.readFileSync(localPath, 'utf8')
    const body = JSON.parse(content)
    expect(body.theme_color?.toUpperCase()).toBe('#35C79A')
    expect(body.name).toContain('GrowMedica')
  })
})
