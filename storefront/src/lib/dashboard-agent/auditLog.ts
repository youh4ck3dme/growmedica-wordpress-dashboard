import { createHash } from 'node:crypto'
import type { AgentToolName, AuditEntry } from './types'

const MAX_ENTRIES = 500

type AuditGlobal = typeof globalThis & { __growmedicaDashboardAudit?: AuditEntry[] }

function getAuditStore(): AuditEntry[] {
  const g = globalThis as AuditGlobal
  if (!g.__growmedicaDashboardAudit) g.__growmedicaDashboardAudit = []
  return g.__growmedicaDashboardAudit
}

export function hashArgs(args: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(args)).digest('hex').slice(0, 16)
}

export function appendAuditEntry(input: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
  const auditEntries = getAuditStore()
  const entry: AuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...input,
  }
  auditEntries.unshift(entry)
  if (auditEntries.length > MAX_ENTRIES) auditEntries.length = MAX_ENTRIES
  return entry
}

export function listAuditEntries(limit = 50, offset = 0): AuditEntry[] {
  const auditEntries = getAuditStore()
  return auditEntries.slice(offset, offset + limit)
}

export function logToolExecution(input: {
  ip: string
  conversation_id: string
  tool: AgentToolName
  args: Record<string, unknown>
  status: AuditEntry['status']
  summary: string
}): AuditEntry {
  return appendAuditEntry({
    ip: input.ip,
    conversation_id: input.conversation_id,
    tool: input.tool,
    status: input.status,
    summary: input.summary,
    args_hash: hashArgs(input.args),
  })
}
