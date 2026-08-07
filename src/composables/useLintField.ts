import { computed } from 'vue'
import { useLint, type LintIssue } from './useLint'
import { useCamundaI18n } from '@/locales'

export interface LintFieldStatus {
  status: 'error' | 'warning'
  feedback: string
  issue: LintIssue
}

/**
 * 将 lint 问题映射到属性面板的某个字段。
 *
 * 根据 bpmnlint report 的 `path`（如 `['name']`、`['camunda:historyTimeToLive']`）
 * 匹配当前元素的输入框字段，返回 NaiveUI 表单校验所需的 status / feedback。
 *
 * @param getModeler 返回当前 bpmnModeler 实例的 getter
 * @param getBusinessObjectId 返回当前元素 businessObject id 的 getter
 * @param fieldPath 字段名（与 lint report 的 path 项一致），可传多个
 * @param localeKeyPrefix 翻译前缀，默认 `bpmnPanel.lint.rules`（按规则名翻译）
 */
export function useLintField(
  getModeler: () => any | null,
  getBusinessObjectId: () => string | undefined,
  fieldPath: string | string[],
  localeKeyPrefix = 'bpmnPanel.lint.rules',
) {
  const { t } = useCamundaI18n()
  const { issuesFor } = useLint(getModeler)

  return computed<LintFieldStatus | null>(() => {
    const boId = getBusinessObjectId()
    if (!boId) return null
    const issues = issuesFor(boId)
    const paths = Array.isArray(fieldPath) ? fieldPath : [fieldPath]
    const matched = issues.find(
      (issue) => Array.isArray(issue.path) && issue.path.some((p) => paths.includes(p)),
    )
    if (!matched) return null

    const status = matched.category === 'error' ? 'error' : 'warning'
    const key = `${localeKeyPrefix}.${matched.rule}`
    const translated = t(key)
    const feedback = translated === key ? matched.message : translated

    return { status, feedback, issue: matched }
  })
}

export type UseLintFieldReturn = ReturnType<typeof useLintField>
