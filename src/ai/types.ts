/**
 * AI 助手公共类型。
 *
 * 库本身不内置任何 AI 服务，而是通过 `aiChat` 回调接入任意实现
 * （OpenAI / 国内大模型 / 自建服务端代理），API Key 等敏感信息应留在服务端。
 */

/** 对话消息（与 OpenAI messages 结构一致，方便直接透传） */
export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** AI 回复结果 */
export interface AiChatResult {
  /** 面向用户展示的文本回复 */
  text: string
  /** 修改后的 BPMN XML；存在时可在画布中预览并一键应用 */
  xml?: string
}

/** AI 助手回调：接收对话历史与当前最新 XML，返回 AI 回复 */
export type AiChatHandler = (
  messages: AiChatMessage[],
  currentXml: string,
) => Promise<AiChatResult | string>
