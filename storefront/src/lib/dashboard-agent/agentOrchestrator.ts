import { Mistral } from '@mistralai/mistralai'
import { getMistralEnv } from '@/lib/ai/env'
import { AiError } from '@/lib/ai/errors'
import { appendConversationMessages, getConversationMessages } from './conversationMemory'
import { logToolExecution } from './auditLog'
import { ADMIN_AGENT_SYSTEM_PROMPT } from './prompts/admin-agent'
import { executeAgentTool, inferToolsFromCommand } from './tools'
import type { AgentAction, AgentMessage, AgentRunResult } from './types'

const MISTRAL_SUMMARY_TIMEOUT_MS = 30_000

function newConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function buildReplyFromActions(command: string, actions: AgentAction[]): string {
  if (actions.length === 0) {
    return 'Nerozpoznal som konkrétnu akciu. Skúste napr.: „Zobraz produkty“, „Súhrn katalógu“, „Export CSV“, „Stav integrácie“.'
  }

  const parts = actions.map((action) => {
    if (action.status === 'error') {
      return `❌ ${action.tool}: ${(action.result as { error?: string }).error ?? 'chyba'}`
    }
    if (action.tool === 'list_products') {
      const r = action.result as { count: number }
      return `✅ Nájdených ${r.count} produktov v katalógu.`
    }
    if (action.tool === 'list_collections') {
      const r = action.result as { count: number }
      return `✅ Nájdených ${r.count} kategórií/kolekcií.`
    }
    if (action.tool === 'get_collection_products') {
      const r = action.result as { category: string; count: number }
      return `✅ Kategória „${r.category}“: ${r.count} produktov.`
    }
    if (action.tool === 'catalog_summary') {
      const r = action.result as {
        product_count: number
        collection_count: number
        price_min: string
        price_max: string
      }
      return `✅ Katalóg: ${r.product_count} produktov, ${r.collection_count} kategórií, ceny ${r.price_min}–${r.price_max} EUR.`
    }
    if (action.tool === 'export_catalog_csv') {
      const r = action.result as { export_id: string; download_path: string }
      return `✅ Export pripravený (ID: ${r.export_id}). Stiahnite cez ${r.download_path}`
    }
    if (action.tool === 'get_integration_status') {
      const r = action.result as Record<string, string>
      return `✅ CMS: ${r.cms_provider}, Mistral: ${r.mistral}, katalóg: ${r.catalog}`
    }
    if (action.tool === 'bulk_update_prices') {
      const r = action.result as { dry_run?: boolean; updates?: unknown[] }
      if (r.dry_run) return `⚠️ Dry-run: ${r.updates?.length ?? 0} cien by sa zmenilo. Potvrďte príkazom s confirm.`
      return `✅ Aktualizovaných ${r.updates?.length ?? 0} cien.`
    }
    if (action.tool === 'optimize_product_copy') {
      const r = action.result as { title?: string }
      return `✅ Návrh copy pre produkt: „${r.title ?? '—'}“`
    }
    if (action.tool === 'generate_product_seo') {
      const r = action.result as { meta_title?: string }
      return `✅ SEO meta: „${r.meta_title ?? '—'}“`
    }
    if (action.tool === 'get_product') {
      const r = action.result as { title?: string; price?: string }
      return `✅ ${r.title ?? 'Produkt'} — ${r.price ?? '—'} EUR`
    }
    return `✅ ${action.tool} dokončené.`
  })

  return `Príkaz: „${command}“\n\n${parts.join('\n')}`
}

function mapMistralError(error: unknown): string {
  if (error instanceof AiError) return error.message
  if (error instanceof Error) {
    if (error.name === 'AbortError') return 'Mistral API neodpovedá včas (timeout). Skúste znova.'
    if (/429|rate limit/i.test(error.message)) return 'Mistral API: príliš veľa požiadaviek. Počkajte chvíľu.'
    if (/503|502|504|unavailable/i.test(error.message)) return 'Mistral API je dočasne nedostupné. Skúste neskôr.'
  }
  return 'Agent je dočasne nedostupný. Skúste príkaz znova.'
}

async function summarizeWithMistral(
  command: string,
  actions: AgentAction[],
  history: AgentMessage[],
): Promise<string> {
  if (process.env.MISTRAL_MOCK_MODE === '1') {
    return buildReplyFromActions(command, actions)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), MISTRAL_SUMMARY_TIMEOUT_MS)

  try {
    const { MISTRAL_API_KEY, MISTRAL_MODEL } = getMistralEnv()
    const client = new Mistral({ apiKey: MISTRAL_API_KEY })
    const response = await client.chat.complete(
      {
        model: MISTRAL_MODEL,
        messages: [
          { role: 'system', content: ADMIN_AGENT_SYSTEM_PROMPT },
          ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          {
            role: 'user',
            content: `Príkaz: ${command}\nVýsledky nástrojov: ${JSON.stringify(actions).slice(0, 3000)}\nZhrň stručne po slovensky.`,
          },
        ],
        temperature: 0.3,
      },
      { signal: controller.signal },
    )

    const content = response.choices?.[0]?.message?.content
    if (typeof content === 'string' && content.trim()) return content.trim()
    return buildReplyFromActions(command, actions)
  } catch (error) {
    console.warn('[dashboard-agent] Mistral summary failed:', error)
    return buildReplyFromActions(command, actions)
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function runDashboardAgent(input: {
  command: string
  conversation_id?: string
  ip: string
}): Promise<AgentRunResult> {
  const conversationId = input.conversation_id ?? newConversationId()
  const command = input.command.trim()
  if (!command) throw new Error('command is required')

  try {
    const history = getConversationMessages(conversationId)
    const planned = inferToolsFromCommand(command)
    const actions: AgentAction[] = []

    for (const plan of planned) {
      const action = await executeAgentTool(plan.tool, plan.args, input.ip)
      actions.push(action)
      await logToolExecution({
        ip: input.ip,
        conversation_id: conversationId,
        tool: plan.tool,
        args: plan.args,
        status: action.status,
        summary: `${plan.tool} → ${action.status}`,
      })
    }

    const reply = await summarizeWithMistral(command, actions, history)

    appendConversationMessages(conversationId, [
      { role: 'user', content: command },
      { role: 'assistant', content: reply },
    ])

    return { conversation_id: conversationId, reply, actions }
  } catch (error) {
    throw new Error(mapMistralError(error))
  }
}
