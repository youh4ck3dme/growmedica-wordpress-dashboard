export type AgentMessageRole = 'user' | 'assistant' | 'system'

export type AgentMessage = {
  role: AgentMessageRole
  content: string
}

/** Agent operating mode — changes system prompt + write constraints, never bypasses live write gate. */
export type AgentMode = 'assist' | 'plan' | 'monitor'

export const AGENT_MODES: readonly AgentMode[] = ['assist', 'plan', 'monitor'] as const

export function isAgentMode(value: unknown): value is AgentMode {
  return value === 'assist' || value === 'plan' || value === 'monitor'
}

export type AgentToolName =
  | 'list_products'
  | 'get_product'
  | 'list_collections'
  | 'get_collection_products'
  | 'catalog_summary'
  | 'optimize_product_copy'
  | 'generate_product_seo'
  | 'bulk_update_prices'
  | 'export_catalog_csv'
  | 'get_integration_status'
  | 'apply_product_copy'
  | 'apply_product_seo'
  | 'update_inventory'
  | 'list_orders'
  | 'get_order'

/** Tools that can mutate catalog/inventory when confirm + DASHBOARD_ALLOW_LIVE_WRITES allow it. */
export const AGENT_WRITE_TOOLS = [
  'bulk_update_prices',
  'apply_product_copy',
  'apply_product_seo',
  'update_inventory',
] as const satisfies readonly AgentToolName[]

export type AgentWriteTool = (typeof AGENT_WRITE_TOOLS)[number]

export function isAgentWriteTool(tool: AgentToolName): tool is AgentWriteTool {
  return (AGENT_WRITE_TOOLS as readonly string[]).includes(tool)
}

export type AgentAction = {
  tool: AgentToolName
  args: Record<string, unknown>
  result: unknown
  status: 'ok' | 'error' | 'dry_run'
}

export type AgentRunResult = {
  conversation_id: string
  reply: string
  actions: AgentAction[]
  mode: AgentMode
}

export type AuditEntry = {
  id: string
  timestamp: string
  ip: string
  conversation_id: string
  tool: AgentToolName | 'agent_command'
  status: 'ok' | 'error' | 'dry_run'
  summary: string
  args_hash: string
}

export type MistralToolCall = {
  id: string
  name: AgentToolName
  arguments: Record<string, unknown>
}
