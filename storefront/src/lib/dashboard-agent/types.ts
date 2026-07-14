export type AgentMessageRole = 'user' | 'assistant' | 'system'

export type AgentMessage = {
  role: AgentMessageRole
  content: string
}

export type AgentToolName =
  | 'list_products'
  | 'get_product'
  | 'optimize_product_copy'
  | 'bulk_update_prices'
  | 'export_catalog_csv'
  | 'get_integration_status'

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
