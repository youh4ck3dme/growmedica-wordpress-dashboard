type MistralChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
  tool_call_id?: string
}

type MistralToolDefinition = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

type MistralChatOptions = {
  apiKey: string
  model: string
  messages: MistralChatMessage[]
  temperature?: number
  responseFormat?: 'json_object'
  tools?: MistralToolDefinition[]
  toolChoice?: 'auto' | 'none' | 'any'
}

export type MistralChatResult = {
  content: string
  toolCalls: Array<{
    id: string
    name: string
    arguments: Record<string, unknown>
  }>
}

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

function parseToolArguments(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/** Direct Mistral REST API — avoids Next.js + SDK fetch incompatibilities. */
export async function mistralChatComplete({
  apiKey,
  model,
  messages,
  temperature = 0.3,
  responseFormat,
  tools,
  toolChoice = 'auto',
}: MistralChatOptions): Promise<string> {
  const result = await mistralChatCompleteWithTools({
    apiKey,
    model,
    messages,
    temperature,
    responseFormat,
    tools,
    toolChoice,
  })
  return result.content
}

export async function mistralChatCompleteWithTools({
  apiKey,
  model,
  messages,
  temperature = 0.3,
  responseFormat,
  tools,
  toolChoice = 'auto',
}: MistralChatOptions): Promise<MistralChatResult> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
  }
  if (responseFormat === 'json_object') {
    body.response_format = { type: 'json_object' }
  }
  if (tools?.length) {
    body.tools = tools
    body.tool_choice = toolChoice
  }

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Mistral API error: ${response.status} — ${text.slice(0, 300)}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: unknown
        tool_calls?: Array<{
          id: string
          type: 'function'
          function: { name: string; arguments: string }
        }>
      }
    }>
  }

  const message = data.choices?.[0]?.message
  const content = extractMessageContent(message?.content).trim()
  const toolCalls =
    message?.tool_calls?.map((call) => ({
      id: call.id,
      name: call.function.name,
      arguments: parseToolArguments(call.function.arguments),
    })) ?? []

  if (!content && toolCalls.length === 0) {
    throw new Error('Mistral API: No content in response')
  }

  return { content, toolCalls }
}
