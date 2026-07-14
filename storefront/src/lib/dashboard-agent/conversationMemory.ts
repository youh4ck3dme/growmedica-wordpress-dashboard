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

function getConversationStore(): Map<string, ConversationRecord> {
  const g = globalThis as MemoryGlobal
  if (!g.__growmedicaDashboardConversations) g.__growmedicaDashboardConversations = new Map()
  return g.__growmedicaDashboardConversations
}

function prune() {
  const conversations = getConversationStore()
  const now = Date.now()
  for (const [id, record] of conversations) {
    if (now - record.updatedAt > TTL_MS) conversations.delete(id)
  }
}

export function getConversationMessages(conversationId: string): AgentMessage[] {
  prune()
  return getConversationStore().get(conversationId)?.messages ?? []
}

export function appendConversationMessages(
  conversationId: string,
  messages: AgentMessage[],
): AgentMessage[] {
  prune()
  const conversations = getConversationStore()
  const existing = conversations.get(conversationId)?.messages ?? []
  const merged = [...existing, ...messages].slice(-MAX_MESSAGES)
  conversations.set(conversationId, { messages: merged, updatedAt: Date.now() })
  return merged
}
