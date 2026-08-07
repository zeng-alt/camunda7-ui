import { ref, watch, onBeforeUnmount, type Ref } from 'vue'

export interface LintIssue {
  id: string
  message: string
  category: 'error' | 'warn' | 'warning' | 'info'
  rule: string
  path?: string[]
  isChildIssue?: boolean
  actualElementId?: string
}

export type IssuesByElement = Record<string, LintIssue[]>

/**
 * 从 bpmn-js 的 `linting` 服务中读取 lint 问题。
 *
 * 通过监听 `linting.completed` 事件实时同步问题列表（按元素 ID 分组）。
 * 需要模型器已注册 `bpmn-js-bpmnlint` 模块（见 `useBpmnModeler` 的 linting 选项）。
 *
 * @param getModeler 返回当前 bpmnModeler 实例的 getter
 * @returns issuesFor(elementId) 获取某个元素的问题列表
 */
export function useLint(getModeler: () => any | null) {
  const issuesByElement = ref<IssuesByElement>({})
  const lintingActive = ref(false)
  let eventBus: any = null
  let linting: any = null

  function syncFromService() {
    const modeler = getModeler()
    if (!modeler) return
    const service = modeler.get('linting', false)
    if (!service) return
    linting = service
    lintingActive.value = !!service.isActive()
    const issues = service.getIssues?.() || service._issues || {}
    issuesByElement.value = issues
  }

  function onLintingCompleted(event: any) {
    issuesByElement.value = event.issues || {}
    const modeler = getModeler()
    if (modeler) {
      const service = modeler.get('linting', false)
      if (service) lintingActive.value = !!service.isActive()
    }
  }

  function attach() {
    detach()
    const modeler = getModeler()
    if (!modeler) return
    eventBus = modeler.get('eventBus')
    if (!eventBus) return
    eventBus.on('linting.completed', onLintingCompleted)
    syncFromService()
  }

  function detach() {
    if (eventBus) {
      eventBus.off('linting.completed', onLintingCompleted)
      eventBus = null
    }
    linting = null
  }

  watch(() => getModeler(), attach, { immediate: true })
  onBeforeUnmount(detach)

  function issuesFor(elementId: string | undefined): LintIssue[] {
    if (!elementId) return []
    return issuesByElement.value[elementId] || []
  }

  function refresh() {
    if (linting && typeof linting.update === 'function') {
      linting.update()
    }
  }

  return { issuesByElement, issuesFor, lintingActive, refresh }
}

export type UseLintReturn = ReturnType<typeof useLint>
