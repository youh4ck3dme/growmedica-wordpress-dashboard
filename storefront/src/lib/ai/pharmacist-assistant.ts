import type { AiProductContext } from '@/lib/ai/context'
import { getRecommendContext } from '@/lib/ai/context'

export type AssistantChatRole = 'user' | 'assistant'

export interface AssistantChatMessage {
  role: AssistantChatRole
  content: string
}

export interface AssistantProductContext {
  handle: string
  title: string
  vendor: string
  productType: string
  tags: string[]
  priceFrom: string
  availableForSale: boolean
}

export interface AssistantHandoff {
  required: boolean
  priority: 'normal' | 'high'
  reason: string
  target: 'support_specialist' | 'human_pharmacist'
  message: string
}

export interface AssistantChatResponse {
  message: string
  suggested_replies?: string[]
  handoff?: AssistantHandoff | null
  conversation_id?: string | null
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
}

function scoreProduct(product: AiProductContext, query: string): number {
  const tokens = normalizeText(query)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3)
  if (tokens.length === 0) return 0

  const haystack = normalizeText(
    [product.title, product.handle, product.vendor, product.productType, ...product.tags].join(' '),
  )

  let score = 0
  for (const token of tokens) {
    if (haystack.includes(token)) score += 1
    if (normalizeText(product.title).includes(token)) score += 2
    if (normalizeText(product.handle).includes(token)) score += 2
  }

  return score
}

function toAssistantContext(product: AiProductContext): AssistantProductContext {
  return {
    handle: product.handle,
    title: product.title,
    vendor: product.vendor,
    productType: product.productType,
    tags: product.tags,
    priceFrom: product.priceFrom,
    availableForSale: product.availableForSale,
  }
}

export async function buildAssistantProductContext(
  query: string,
  limit = 6,
): Promise<AssistantProductContext[]> {
  const { products } = await getRecommendContext({ query, limit: 40 })

  const scored = products
    .map((product) => ({ product, score: scoreProduct(product, query) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)

  if (scored.length > 0) {
    return scored.map((entry) => toAssistantContext(entry.product))
  }

  return products.slice(0, Math.min(limit, 3)).map(toAssistantContext)
}

const HANDOFF_PATTERNS = [
  /bolest\s+(hrud|srdc)/i,
  /infarkt/i,
  /mrtvica/i,
  /krvac/i,
  /nedycham/i,
  /anafyl/i,
  /samovrazd/i,
  /sebapo/i,
]

export function detectHandoff(userText: string): AssistantHandoff | null {
  const normalized = normalizeText(userText)
  const matched = HANDOFF_PATTERNS.some((pattern) => pattern.test(normalized))
  if (!matched) return null

  return {
    required: true,
    priority: 'high',
    reason: 'acute_or_serious_symptoms',
    target: 'human_pharmacist',
    message:
      'Pri akútnych alebo závažných ťažkostiach kontaktujte lekára alebo lekárňu. Môžete nás tiež kontaktovať cez /kontakt.',
  }
}
