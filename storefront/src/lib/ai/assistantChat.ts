import { Mistral } from '@mistralai/mistralai'
import { ASSISTANT_CART_HINT, PHARMACIST_PERSONA } from '@/lib/ai/prompts/pharmacist'
import {
  buildAssistantProductContext,
  detectHandoff,
  toAssistantProductCard,
  type AssistantBundleSuggestion,
  type AssistantChatMessage,
  type AssistantChatResponse,
  type AssistantProductCard,
  type AssistantProductContext,
} from '@/lib/ai/pharmacist-assistant'
import { getSafeDisclaimer, checkCompliance } from '@/lib/ai/compliance'
import { getMistralEnv } from '@/lib/ai/env'
import { AiError } from '@/lib/ai/errors'
import { checkRateLimit } from '@/lib/ai/rateLimit'

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000
const TIMEOUT_MS = 30_000

type ChatWithPharmacistInput = {
  messages: AssistantChatMessage[]
  conversationId?: string
  ip: string
}

type AssistantUiLocale = 'sk' | 'cs' | 'en' | 'de'

function extractMessageContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((chunk) => {
        if (typeof chunk === 'string') return chunk
        if (chunk && typeof chunk === 'object' && 'text' in chunk) {
          return String((chunk as { text?: string }).text ?? '')
        }
        return ''
      })
      .join('')
  }
  return ''
}

function isRetryableError(error: Error): boolean {
  if (error.name === 'AbortError') return true
  return /429|50[0-4]/.test(error.message)
}

function isAuthError(error: Error): boolean {
  return /401|403|unauthorized|forbidden|invalid api key/i.test(error.message)
}

function getLastUserMessage(messages: AssistantChatMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === 'user') {
      return messages[index].content.trim()
    }
  }
  return ''
}

function detectAssistantLocale(lastUser: string): AssistantUiLocale {
  const normalized = lastUser.toLowerCase()
  if (/[äöüß]/.test(normalized) || /(hallo|bitte|schlaf|bestellung|danke)/.test(normalized)) {
    return 'de'
  }
  if (/(hello|please|order|sleep|energy|support)/.test(normalized)) {
    return 'en'
  }
  if (/(doporuc|objednavk|spánek|košík|podpora)/.test(normalized)) {
    return 'cs'
  }
  return 'sk'
}

function localeCopy(locale: AssistantUiLocale) {
  switch (locale) {
    case 'en':
      return {
        suggestions: ['Recommend a product for sleep', 'How do I complete my order?', 'Support contact'],
        productLead: 'Based on your request, these products are the best fit to review first.',
        fallback: 'I did not find a strong direct match yet, but these products are the closest starting point from the catalog.',
        nextStep: 'Open a product detail and compare the composition, dosage, and stock availability.',
        bundleTitle: 'Suggested combination',
        bundleCta: 'Review these together',
        handoffSuggestion: ['Go to contact', 'Recommend a product'],
        warning: getSafeDisclaimer(),
      }
    case 'de':
      return {
        suggestions: ['Empfiehl mir ein Produkt für den Schlaf', 'Wie schließe ich die Bestellung ab?', 'Support-Kontakt'],
        productLead: 'Zu Ihrer Anfrage passen diese Produkte am besten als erster Schritt.',
        fallback: 'Ich habe noch keinen exakten Treffer gefunden, aber diese Produkte sind der beste Ausgangspunkt aus dem Katalog.',
        nextStep: 'Öffnen Sie ein Produktdetail und vergleichen Sie Zusammensetzung, Dosierung und Verfügbarkeit.',
        bundleTitle: 'Empfohlene Kombination',
        bundleCta: 'Gemeinsam ansehen',
        handoffSuggestion: ['Zum Kontakt', 'Produkt empfehlen'],
        warning: getSafeDisclaimer(),
      }
    case 'cs':
      return {
        suggestions: ['Doporuč mi produkt na spánek', 'Jak dokončím objednávku?', 'Kontakt na podporu'],
        productLead: 'Podle vašeho dotazu dávají největší smysl tyto produkty jako první výběr.',
        fallback: 'Nenašel jsem úplně přesnou shodu, ale tyto produkty jsou nejlepší výchozí bod z katalogu.',
        nextStep: 'Otevřete detail produktu a porovnejte složení, dávkování a dostupnost.',
        bundleTitle: 'Doporučená kombinace',
        bundleCta: 'Projít společně',
        handoffSuggestion: ['Přejít na kontakt', 'Doporuč mi produkt'],
        warning: getSafeDisclaimer(),
      }
    case 'sk':
    default:
      return {
        suggestions: ['Odporuč mi produkt na spánok', 'Ako dokončím objednávku?', 'Kontakt na podporu'],
        productLead: 'Podľa vašej otázky dávajú najväčší zmysel tieto produkty ako prvý výber.',
        fallback: 'Nenašiel som úplne presnú zhodu, ale tieto produkty sú najlepší štart z katalógu.',
        nextStep: 'Otvorte detail produktu a porovnajte zloženie, dávkovanie a dostupnosť.',
        bundleTitle: 'Odporúčaná kombinácia',
        bundleCta: 'Pozrieť spolu',
        handoffSuggestion: ['Prejsť na kontakt', 'Odporuč mi produkt'],
        warning: getSafeDisclaimer(),
      }
  }
}

function defaultSuggestedReplies(lastUser: string): string[] {
  const locale = detectAssistantLocale(lastUser)
  const normalized = lastUser.toLowerCase()
  const copy = localeCopy(locale)

  if (/objedn|kosik|košík|platb|order|checkout|bestell/i.test(normalized)) {
    return [copy.suggestions[1], copy.suggestions[0], copy.suggestions[2]]
  }

  return copy.suggestions
}

function buildBundleSuggestion(
  locale: AssistantUiLocale,
  products: AssistantProductCard[],
): AssistantBundleSuggestion | null {
  if (products.length < 2) return null
  const copy = localeCopy(locale)
  return {
    title: copy.bundleTitle,
    cta: copy.bundleCta,
    products: products.slice(0, 2),
  }
}

function getMockResponse(
  lastUser: string,
  productContext: AssistantProductContext[],
): AssistantChatResponse {
  const locale = detectAssistantLocale(lastUser)
  const copy = localeCopy(locale)
  const handoff = detectHandoff(lastUser)
  const recommendedProducts = productContext.map(toAssistantProductCard)

  if (handoff) {
    return {
      message: handoff.message,
      suggested_replies: copy.handoffSuggestion,
      handoff,
      warning: copy.warning,
      next_step: null,
      recommended_products: recommendedProducts.slice(0, 2),
      bundle_suggestion: null,
    }
  }

  const productLine =
    recommendedProducts.length > 0
      ? `${copy.productLead} ${recommendedProducts
          .slice(0, 2)
          .map((product) => product.title)
          .join(' / ')}.`
      : copy.fallback

  return {
    message: `${productLine} ${ASSISTANT_CART_HINT}`,
    suggested_replies: defaultSuggestedReplies(lastUser),
    handoff: null,
    warning: copy.warning,
    next_step: copy.nextStep,
    recommended_products: recommendedProducts,
    bundle_suggestion: buildBundleSuggestion(locale, recommendedProducts),
  }
}

async function completeChatWithKey(
  apiKey: string,
  mistralMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model: string,
): Promise<string> {
  const client = new Mistral({ apiKey })
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await client.chat.complete(
      {
        model,
        messages: mistralMessages,
        temperature: 0.2,
      },
      { signal: controller.signal },
    )

    const rawContent = response.choices?.[0]?.message?.content
    const text = extractMessageContent(rawContent).trim()
    if (!text) {
      throw new Error('Mistral API: No content in response')
    }
    return text
  } finally {
    clearTimeout(timeoutId)
  }
}

function buildMistralMessages(
  messages: AssistantChatMessage[],
  productContext: AssistantProductContext[],
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const catalogBlock =
    productContext.length > 0
      ? `

Dostupné produkty (odporúčaj len tieto, s presným názvom):
${JSON.stringify(productContext)}`
      : ''

  const systemContent = `${PHARMACIST_PERSONA}

${getSafeDisclaimer()}
${ASSISTANT_CART_HINT}${catalogBlock}`

  const trimmed = messages.slice(-12)
  return [
    { role: 'system', content: systemContent },
    ...trimmed.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ]
}

export async function chatWithPharmacist(input: ChatWithPharmacistInput): Promise<AssistantChatResponse> {
  const lastUser = getLastUserMessage(input.messages)
  if (!lastUser) {
    throw new AiError('Správa je prázdna.', 400)
  }

  const complianceIssues = checkCompliance(lastUser)
  if (complianceIssues.length > 0) {
    throw new AiError('Vstup obsahuje zakázané tvrdenia. Skúste to formulovať inak.', 422)
  }

  const rateLimit = await checkRateLimit(input.ip)
  if (!rateLimit.allowed) {
    throw new AiError('Príliš veľa požiadaviek. Skúste to prosím neskôr.', 429)
  }

  const locale = detectAssistantLocale(lastUser)
  const copy = localeCopy(locale)
  const handoff = detectHandoff(lastUser)
  const productContext = await buildAssistantProductContext(lastUser)
  const recommendedProducts = productContext.map(toAssistantProductCard)
  const bundleSuggestion = buildBundleSuggestion(locale, recommendedProducts)

  if (process.env.MISTRAL_MOCK_MODE === '1') {
    return {
      ...getMockResponse(lastUser, productContext),
      conversation_id: input.conversationId ?? null,
    }
  }

  const { MISTRAL_API_KEY, MISTRAL_API_KEY_BACKUP, MISTRAL_MODEL } = getMistralEnv()
  const apiKeys = [MISTRAL_API_KEY, MISTRAL_API_KEY_BACKUP].filter(
    (key, index, keys): key is string => Boolean(key) && keys.indexOf(key) === index,
  )

  const mistralMessages = buildMistralMessages(input.messages, productContext)
  let lastError: Error | undefined
  let rendered = ''

  for (const apiKey of apiKeys) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        rendered = await completeChatWithKey(apiKey, mistralMessages, MISTRAL_MODEL)
        lastError = undefined
        break
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        if (isAuthError(lastError) && apiKey !== apiKeys[apiKeys.length - 1]) {
          break
        }
        if (!isRetryableError(lastError) || attempt === MAX_RETRIES - 1) {
          break
        }
        await new Promise((resolve) => setTimeout(resolve, BASE_DELAY_MS * 2 ** attempt))
      }
    }
    if (rendered) break
    if (lastError && !isAuthError(lastError)) break
  }

  if (!rendered) {
    console.error('[Assistant] Mistral failed:', lastError?.message)
    throw new AiError('Chat je dočasne nedostupný. Skúste to prosím neskôr.', 503)
  }

  return {
    message: rendered,
    suggested_replies: defaultSuggestedReplies(lastUser),
    handoff,
    warning: copy.warning,
    next_step: copy.nextStep,
    recommended_products: recommendedProducts,
    bundle_suggestion: bundleSuggestion,
    conversation_id: input.conversationId ?? null,
  }
}
