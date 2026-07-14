import { test, expect } from '@playwright/test'
import {
  buildMockOptimizedCopy,
  stripHtml,
  validateProductCopyOutput,
} from '@/lib/dashboard-agent/copyQuality'
import { buildOptimizeProductCopyPrompt } from '@/lib/dashboard-agent/prompts/optimize-product-copy'

test.describe('Product copy quality (E4)', () => {
  test('validateProductCopyOutput accepts compliant SK copy', () => {
    const result = validateProductCopyOutput({
      title: 'Reishi extrakt — prírodný doplnok pre každodennú podporu',
      short_description:
        'Prírodný výživový doplnok s extraktom huby reishi. Vhodný ako súčasť vyváženej stravy a aktívneho životného štýlu.',
    })
    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
  })

  test('validateProductCopyOutput rejects liečebné tvrdenia', () => {
    const result = validateProductCopyOutput({
      title: 'Produkt, ktorý vylieči každú chorobu',
      short_description:
        'Tento doplnok nahradí lekára a zaručuje 100% účinnosť pri liečbe všetkých ochorení.',
    })
    expect(result.ok).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  test('validateProductCopyOutput rejects too short fields', () => {
    const result = validateProductCopyOutput({
      title: 'Krátky',
      short_description: 'Príliš krátke.',
    })
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.includes('title'))).toBe(true)
    expect(result.issues.some((i) => i.includes('short_description'))).toBe(true)
  })

  test('buildMockOptimizedCopy passes validation for mock catalog product', () => {
    const copy = buildMockOptimizedCopy({
      title: 'proteiny-mock-1 Mock 0',
      description: '<p>Mock produkt pre proteiny</p>',
    })
    const result = validateProductCopyOutput(copy)
    expect(result.ok).toBe(true)
    expect(copy.title).toContain('optimalizované')
    expect(copy.short_description.length).toBeGreaterThanOrEqual(40)
  })

  test('stripHtml removes HTML tags', () => {
    expect(stripHtml('<p>Text <strong>tu</strong></p>')).toBe('Text tu')
  })

  test('buildOptimizeProductCopyPrompt includes SK and compliance rules', () => {
    const prompt = buildOptimizeProductCopyPrompt({
      title: 'Omega-3',
      description: 'Popis produktu',
    })
    expect(prompt).toContain('GrowMedica')
    expect(prompt).toContain('slovensky')
    expect(prompt).toContain('liečba')
    expect(prompt).toContain('Omega-3')
  })

  test('buildOptimizeProductCopyPrompt includes retry issues on second attempt', () => {
    const prompt = buildOptimizeProductCopyPrompt(
      { title: 'Test', description: 'Popis' },
      ['title príliš krátky'],
    )
    expect(prompt).toContain('title príliš krátky')
  })
})
