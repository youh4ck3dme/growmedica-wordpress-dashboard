import type { AgentMessage } from './types'

type ConversationRecord = {
  messages: AgentMessage[]
  updatedAt: number
}

type MemoryGlobal = typeof globalThis & {
  __growmedicaDashboardConversations?: Map<string, ConversationRecord>
}

const MAX_MESSAGES = 40
const TTL_MS = 24 * 60 * 60 * 1000
const CONVERSATION_REDIS_PREFIX = 'growmedica:dashboard:conv:'

function getConversationStore(): Map<string, ConversationRecord> {
  const g = globalThis as MemoryGlobal
  if (!g.__growmedicaDashboardConversations) g.__growmedicaDashboardConversations = new Map()
  return g.__growmedicaDashboardConversations
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

function pruneMemory() {
  const conversations = getConversationStore()
  const now = Date.now()
  for (const [id, record] of conversations) {
    if (now - record.updatedAt > TTL_MS) conversations.delete(id)
  }
}

export function getConversationMessages(conversationId: string): AgentMessage[] {
  pruneMemory()
  return getConversationStore().get(conversationId)?.messages ?? []
}

export async function getConversationMessagesAsync(conversationId: string): Promise<AgentMessage[]> {
  if (hasUpstash()) {
    try {
      const raw = await upstashCommand(['GET', `${CONVERSATION_REDIS_PREFIX}${conversationId}`])
      if (typeof raw === 'string' && raw) {
        const parsed = JSON.parse(raw) as ConversationRecord
        return parsed.messages ?? []
      }
    } catch (error) {
      console.warn('[conversationMemory] Upstash read failed:', error)
    }
  }
  return getConversationMessages(conversationId)
}

export function appendConversationMessages(
  conversationId: string,
  messages: AgentMessage[],
): AgentMessage[] {
  pruneMemory()
  const conversations = getConversationStore()
  const existing = conversations.get(conversationId)?.messages ?? []
  const merged = [...existing, ...messages].slice(-MAX_MESSAGES)
  const record: ConversationRecord = { messages: merged, updatedAt: Date.now() }
  conversations.set(conversationId, record)

  if (hasUpstash()) {
    void upstashCommand([
      'SET',
      `${CONVERSATION_REDIS_PREFIX}${conversationId}`,
      JSON.stringify(record),
      'EX',
      Math.floor(TTL_MS / 1000),
    ]).catch((error) => {
      console.warn('[conversationMemory] Upstash write failed:', error)
    })
  }

  return merged
}
