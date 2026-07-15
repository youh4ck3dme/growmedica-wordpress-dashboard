type MistralChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type MistralChatOptions = {
  apiKey: string
  model: string
  messages: MistralChatMessage[]
  temperature?: number
  responseFormat?: 'json_object'
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

/** Direct Mistral REST API — avoids Next.js + SDK fetch incompatibilities. */
export async function mistralChatComplete({
  apiKey,
  model,
  messages,
  temperature = 0.3,
  responseFormat,
}: MistralChatOptions): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
  }
  if (responseFormat === 'json_object') {
    body.response_format = { type: 'json_object' }
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
    choices?: Array<{ message?: { content?: unknown } }>
  }
  const text = extractMessageContent(data.choices?.[0]?.message?.content).trim()
  if (!text) {
    throw new Error('Mistral API: No content in response')
  }
  return text
}
