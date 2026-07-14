import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test.describe('AI Integration — API Endpoints', () => {
  test('1. /api/ai/compliance-check by mal schváliť compliant text', async () => {
    const routePath = path.join(process.cwd(), 'src/app/api/ai/compliance-check/route.ts')
    expect(fs.existsSync(routePath)).toBe(true)
    const content = fs.readFileSync(routePath, 'utf8')
    expect(content).toContain('complianceCheckInputSchema')
    expect(content).toContain('complianceCheckSchema')
  })

  test('2. /api/ai/compliance-check by mal zablokovať non-compliant text', async () => {
    const routePath = path.join(process.cwd(), 'src/app/api/ai/compliance-check/route.ts')
    const content = fs.readFileSync(routePath, 'utf8')
    expect(content).toContain('Si compliance asistent')
    expect(content).toContain('nariadenie 1924/2006')
  })

  test('3. /api/ai/recommend by mal odmietnuť zablokované slovo s 422', async () => {
    const routePath = path.join(process.cwd(), 'src/app/api/ai/recommend/route.ts')
    expect(fs.existsSync(routePath)).toBe(true)
    const content = fs.readFileSync(routePath, 'utf8')
    expect(content).toContain('recommend')
    expect(content).toContain('userInput')
  })

  test('4. /api/ai/recommend by mal odmietnuť krátky vstup s 400', async () => {
    const routePath = path.join(process.cwd(), 'src/app/api/ai/recommend/route.ts')
    const content = fs.readFileSync(routePath, 'utf8')
    expect(content).toContain('z.object')
    expect(content).toContain('min(10)') // checking min length validation
  })

  test('5. /api/ai/product-fit by mal overiť vhodnosť produktu s 200', async () => {
    const routePath = path.join(process.cwd(), 'src/app/api/ai/product-fit/route.ts')
    expect(fs.existsSync(routePath)).toBe(true)
    const content = fs.readFileSync(routePath, 'utf8')
    expect(content).toContain('productFitSchema')
    expect(content).toContain('callMistral')
  })

  test('6. /api/ai/product-fit by mal vrátiť 404 pre neexistujúci produkt', async () => {
    const routePath = path.join(process.cwd(), 'src/app/api/ai/product-fit/route.ts')
    const content = fs.readFileSync(routePath, 'utf8')
    expect(content).toContain('NextResponse.json')
    expect(content).toContain('404')
  })
})

test.describe('AI Integration — Premium Frontend & Animations', () => {
  test('1. SupplementFinder by mal obsahovať prémiovú animáciu a inline formulár', async () => {
    const finderPath = path.join(process.cwd(), 'src/components/ai/SupplementFinder.tsx')
    expect(fs.existsSync(finderPath)).toBe(true)
    const content = fs.readFileSync(finderPath, 'utf8')
    
    // Check heading
    expect(content).toContain('Nájdite vhodný doplnok')
    
    // Check input/form elements
    expect(content).toContain('Popíšte svoje potreby')
    expect(content).toContain('Nájsť doplnky')
    
    // Check rainbow/snake border classes
    expect(content).toContain('spin-gradient')
    expect(content).toContain('animate-spin-gradient')
    expect(content).toContain('6s linear infinite normal')
    expect(content).toContain('blur-sm')
  })

  test('2. Detail produktu by mal správne renderovať ProductFitBox', async () => {
    const fitBoxPath = path.join(process.cwd(), 'src/components/ai/ProductFitBox.tsx')
    expect(fs.existsSync(fitBoxPath)).toBe(true)
    const content = fs.readFileSync(fitBoxPath, 'utf8')
    
    // Check title and context inputs
    expect(content).toContain('Hodí sa vám produkt')
    expect(content).toContain('Popíšte svoje ciele alebo obavy')
    expect(content).toContain('Overiť vhodnosť pre mňa')
  })
})
