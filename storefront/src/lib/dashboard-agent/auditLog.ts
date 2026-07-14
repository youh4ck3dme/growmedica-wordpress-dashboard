import { createHash } from 'node:crypto'
import type { AgentToolName, AuditEntry } from './types'

const MAX_ENTRIES = 500
const AUDIT_REDIS_KEY = 'growmedica:dashboard:audit'

type AuditGlobal = typeof globalThis & { __growmedicaDashboardAudit?: AuditEntry[] }

function getInMemoryAuditStore(): AuditEntry[] {
  const g = globalThis as AuditGlobal
  if (!g.__growmedicaDashboardAudit) g.__growmedicaDashboardAudit = []
  return g.__growmedicaDashboardAudit
}

function hasUpstash(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  )
}

async function upstashCommand(command: (string | number)[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL!.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!.trim()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Upstash error: ${response.status}`)
    const payload = (await response.json()) as { result?: unknown }
    return payload.result
  } finally {
    clearTimeout(timeoutId)
  }
}

async function readAuditFromRedis(): Promise<AuditEntry[]> {
  const raw = await upstashCommand(['LRANGE', AUDIT_REDIS_KEY, 0, MAX_ENTRIES - 1])
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      try {
        return typeof item === 'string' ? (JSON.parse(item) as AuditEntry) : null
      } catch {
        return null
      }
    })
    .filter((entry): entry is AuditEntry => entry !== null)
}

async function writeAuditToRedis(entry: AuditEntry): Promise<void> {
  await upstashCommand(['LPUSH', AUDIT_REDIS_KEY, JSON.stringify(entry)])
  await upstashCommand(['LTRIM', AUDIT_REDIS_KEY, 0, MAX_ENTRIES - 1])
}

export function hashArgs(args: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(args)).digest('hex').slice(0, 16)
}

export async function appendAuditEntry(input: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry> {
  const entry: AuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...input,
  }

  if (hasUpstash()) {
    try {
      await writeAuditToRedis(entry)
      return entry
    } catch (error) {
      console.warn('[auditLog] Upstash write failed, falling back to memory:', error)
    }
  }

  const auditEntries = getInMemoryAuditStore()
  auditEntries.unshift(entry)
  if (auditEntries.length > MAX_ENTRIES) auditEntries.length = MAX_ENTRIES
  return entry
}

export async function listAuditEntries(limit = 50, offset = 0): Promise<AuditEntry[]> {
  if (hasUpstash()) {
    try {
      const entries = await readAuditFromRedis()
      return entries.slice(offset, offset + limit)
    } catch (error) {
      console.warn('[auditLog] Upstash read failed, falling back to memory:', error)
    }
  }

  const auditEntries = getInMemoryAuditStore()
  return auditEntries.slice(offset, offset + limit)
}

export async function logToolExecution(input: {
  ip: string
  conversation_id: string
  tool: AgentToolName
  args: Record<string, unknown>
  status: AuditEntry['status']
  summary: string
}): Promise<AuditEntry> {
  return appendAuditEntry({
    ip: input.ip,
    conversation_id: input.conversation_id,
    tool: input.tool,
    status: input.status,
    summary: input.summary,
    args_hash: hashArgs(input.args),
  })
}
