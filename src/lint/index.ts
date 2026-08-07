export { linterConfig } from './config'
export type { LinterConfig } from './config'
export { default as camunda7RuleFactories } from './rules'
export type { LintRuleFactory, LintNode, LintReporter } from './rules'

/** 单条 lint 校验报告（对外暴露的结构） */
export interface LintReport {
  /** 元素 id */
  id: string
  /** 校验消息 */
  message: string
  /** 严重级别 */
  category: 'error' | 'warn' | 'warning' | 'info'
  /** 规则名 */
  rule: string
  /** 关联的属性路径 */
  path?: string[]
}

/** 校验结果（对外暴露） */
export interface ValidateResult {
  /** 问题总数 */
  total: number
  /** 错误数 */
  errors: number
  /** 警告数 */
  warnings: number
  /** 提示数 */
  infos: number
  /** 问题列表 */
  reports: LintReport[]
  /** 按元素 id 分组的问题 */
  byElement: Record<string, LintReport[]>
}
