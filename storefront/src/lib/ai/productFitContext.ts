import { getCategoryDefinition, resolveCategory } from '@/lib/category-map'
import type { Product } from '@/lib/shopify/types'

const MAX_TEXT_LENGTH = 1200

export type ProductFitPromptContext = {
  title: string
  description: string
  ingredients: string | null
  categories: string[]
  tags: string[]
  usage: string | null
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(text: string, max = MAX_TEXT_LENGTH): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).trim()}…`
}

function getMetafieldPlainText(product: Product, keys: string[]): string | null {
  const fields = product.metafields?.filter(Boolean) ?? []
  for (const key of keys) {
    const field = fields.find((f) => f && f.key === key && f.value.trim())
    if (field) {
      const raw =
        field.type === 'multi_line_text_field' || field.value.includes('<')
          ? htmlToPlainText(field.value)
          : field.value.trim()
      return raw ? truncate(raw) : null
    }
  }
  return null
}

/** Builds structured product data for the Product Fit AI prompt (Prompt #4). */
export function buildProductFitPromptContext(product: Product): ProductFitPromptContext {
  const categorySlug = resolveCategory(product)
  const categoryTitle = getCategoryDefinition(categorySlug).title

  const categories = Array.from(
    new Set([categoryTitle, product.productType].filter((value) => value.trim())),
  )

  const description = truncate(htmlToPlainText(product.descriptionHtml || product.description))

  return {
    title: product.title,
    description,
    ingredients: getMetafieldPlainText(product, ['composition', 'zlozenie']),
    categories,
    tags: product.tags.slice(0, 12),
    usage: getMetafieldPlainText(product, ['usage', 'davkovanie', 'navod_pouzitia', 'navod']),
  }
}
