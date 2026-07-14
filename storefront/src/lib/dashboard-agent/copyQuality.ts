import { checkCompliance } from '@/lib/ai/compliance'

export type ProductCopyOutput = {
  title: string
  short_description: string
}

export type CopyQualityResult = {
  ok: boolean
  issues: string[]
}

const TITLE_MIN = 10
const TITLE_MAX = 80
const SHORT_DESC_MIN = 40
const SHORT_DESC_MAX = 220

/** Odstráni HTML tagy z popisu (Woo/Shopify môže vracať HTML). */
export function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Overí výstup optimize_product_copy — compliance, dĺžky, neprázdne polia. */
export function validateProductCopyOutput(copy: ProductCopyOutput): CopyQualityResult {
  const issues: string[] = []
  const title = copy.title.trim()
  const shortDescription = copy.short_description.trim()

  if (!title) {
    issues.push('title je prázdny')
  } else {
    if (title.length < TITLE_MIN) issues.push(`title príliš krátky (${title.length} < ${TITLE_MIN})`)
    if (title.length > TITLE_MAX) issues.push(`title príliš dlhý (${title.length} > ${TITLE_MAX})`)
    issues.push(...checkCompliance(title))
  }

  if (!shortDescription) {
    issues.push('short_description je prázdny')
  } else {
    if (shortDescription.length < SHORT_DESC_MIN) {
      issues.push(`short_description príliš krátky (${shortDescription.length} < ${SHORT_DESC_MIN})`)
    }
    if (shortDescription.length > SHORT_DESC_MAX) {
      issues.push(`short_description príliš dlhý (${shortDescription.length} > ${SHORT_DESC_MAX})`)
    }
    issues.push(...checkCompliance(shortDescription))
  }

  return { ok: issues.length === 0, issues }
}

export function buildMockOptimizedCopy(product: {
  title: string
  description: string
}): ProductCopyOutput {
  const plain = stripHtml(product.description)
  let shortDescription = plain.slice(0, 160).trim()
  if (shortDescription.length < SHORT_DESC_MIN) {
    shortDescription = `${product.title} — výživový doplnok pre každodennú podporu vitality a pohody.`
  }
  return {
    title: `${product.title} — optimalizované`,
    short_description: shortDescription,
  }
}
