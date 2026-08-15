import type { AiChatHandler, AiChatMessage } from './types'

/**
 * 从 AI 回复文本中提取 BPMN XML。
 * 支持 ```xml 代码块包裹或直接以 `<?xml` 开头的内容。
 */
export function extractBpmnXml(text: string): string | null {
  if (!text) return null
  const fenced = text.match(/```(?:xml)?\s*([\s\S]*?)```/i)
  if (fenced && fenced[1]?.trim()) return fenced[1].trim()
  const start = text.indexOf('<?xml')
  if (start !== -1) return text.slice(start).trim()
  return null
}

export const defaultAiSystemPrompt = `You are a BPMN 2.0 (Camunda Platform 7) modeling assistant embedded in a process designer.

The user provides the current BPMN 2.0 XML and a request to modify it.
Modify the XML according to the request. Keep all <bpmndi:BPMNDiagram> / DI elements intact so the existing layout is preserved whenever possible. Only add or change what the request needs.

Reply with the COMPLETE modified BPMN 2.0 XML wrapped in a fenced code block tagged as xml, e.g.:

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions ...>
  ...
</bpmn:definitions>
\`\`\`

If you cannot produce valid XML, briefly explain the problem in plain text instead.`

export interface OpenAiAdapterOptions {
  /** OpenAI API Key（建议仅在服务端代理场景使用） */
  apiKey: string
  /** 模型名，默认 gpt-4o-mini */
  model?: string
  /** 兼容 OpenAI 的 API 地址，默认 https://api.openai.com/v1；可指向自建代理 */
  baseUrl?: string
  /** 自定义系统提示词 */
  systemPrompt?: string
  /** 额外请求头 */
  headers?: Record<string, string>
}

/**
 * 创建 OpenAI 兼容的 `AiChatHandler`。
 *
 * @example
 * const aiChat = createOpenAiAdapter({
 *   apiKey: import.meta.env.VITE_OPENAI_API_KEY,
 *   model: 'gpt-4o-mini',
 * })
 */
export function createOpenAiAdapter(options: OpenAiAdapterOptions): AiChatHandler {
  const baseUrl = (options.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const model = options.model || 'gpt-4o-mini'
  const systemPrompt = options.systemPrompt || defaultAiSystemPrompt

  return async (messages, currentXml) => {
    const payload: AiChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Current BPMN 2.0 XML:\n\`\`\`xml\n${currentXml}\n\`\`\`` },
      ...messages,
    ]

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.apiKey}`,
        ...options.headers,
      },
      body: JSON.stringify({ model, messages: payload, temperature: 0.2 }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`OpenAI request failed (${res.status}): ${detail}`)
    }

    const data = await res.json()
    const text: string = data?.choices?.[0]?.message?.content ?? ''
    return { text, xml: extractBpmnXml(text) ?? undefined }
  }
}
