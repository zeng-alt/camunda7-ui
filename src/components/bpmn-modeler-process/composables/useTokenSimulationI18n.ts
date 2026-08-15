/**
 * bpmn-js-token-simulation 的中文/国际化适配。
 *
 * 该库的所有 UI 文案（调色板、上下文面板、日志、通知等）均为硬编码英文，
 * 且未走 diagram-js 的 translate 服务，因此这里通过在画布容器上挂载
 * MutationObserver，对新出现的仿真 DOM 元素进行标题/文本替换，并保留
 * 原始英文文案（data-camunda7-i18n-*）以支持运行时切换语言后重新翻译。
 */

export interface UseTokenSimulationI18nOptions {
  /** 返回画布容器 DOM 元素（与 modeler 的 container 一致） */
  container: () => HTMLElement | null
  /** 国际化翻译函数，如 useCamundaI18n() 返回的 t */
  t: (key: string) => string
}

export interface UseTokenSimulationI18n {
  /** 重新翻译画布中所有已存在的仿真元素（语言切换时调用） */
  reapply: () => void
  /** 卸载 MutationObserver */
  dispose: () => void
}

/** 需要监听的新增节点选择器 */
const WATCH_SELECTOR = [
  '.bts-entry',
  '.bts-context-pad',
  '.bts-notification',
  '.bts-element-notification',
  '.bts-log',
  '.bts-scope',
  '.bts-animation-speed-button',
].join(',')

/** 完整文案（标题 / 文本 / 日志） → 语言 key */
const EXACT_MESSAGE_KEYS: Record<string, string> = {
  'Play Simulation': 'bpmnPanel.tokenSimulation.play',
  'Pause Simulation': 'bpmnPanel.tokenSimulation.pause',
  'Play/Pause Simulation': 'bpmnPanel.tokenSimulation.playPause',
  'Reset Simulation': 'bpmnPanel.tokenSimulation.reset',
  'Simulation Log': 'bpmnPanel.tokenSimulation.log',
  'Toggle Simulation Log': 'bpmnPanel.tokenSimulation.toggleLog',
  'No Entries': 'bpmnPanel.tokenSimulation.noEntries',
  Close: 'bpmnPanel.tokenSimulation.close',
  'Trigger Event': 'bpmnPanel.tokenSimulation.triggerEvent',
  'Add pause point': 'bpmnPanel.tokenSimulation.addPausePoint',
  'Remove pause point': 'bpmnPanel.tokenSimulation.removePausePoint',
  'Set Sequence Flow': 'bpmnPanel.tokenSimulation.setSequenceFlow',
  'Found unsupported elements': 'bpmnPanel.tokenSimulation.foundUnsupportedElements',
  'Not supported': 'bpmnPanel.tokenSimulation.notSupported',
  Finished: 'bpmnPanel.tokenSimulation.finishedNotification',
}

/** 日志/通知中的元素类型兜底名 → 语言 key */
const NAME_KEYS: Record<string, string> = {
  Process: 'bpmnPanel.tokenSimulation.process',
  SubProcess: 'bpmnPanel.tokenSimulation.subProcess',
  'Service Task': 'bpmnPanel.types.service-task',
  'User Task': 'bpmnPanel.types.user-task',
  'Call Activity': 'bpmnPanel.types.call-activity',
  'Script Task': 'bpmnPanel.types.script-task',
  'Business Rule Task': 'bpmnPanel.types.business-rule-task',
  'Manual Task': 'bpmnPanel.types.manual-task',
  'Receive Task': 'bpmnPanel.types.receive-task',
  'Send Task': 'bpmnPanel.types.send-task',
  Task: 'bpmnPanel.types.task',
  'Exclusive Gateway': 'bpmnPanel.types.exclusive-gateway',
  'Parallel Gateway': 'bpmnPanel.types.parallel-gateway',
  'Inclusive Gateway': 'bpmnPanel.types.inclusive-gateway',
  'Start Event': 'bpmnPanel.types.start-event',
  'Intermediate Event': 'bpmnPanel.tokenSimulation.intermediateEvent',
  'Boundary Event': 'bpmnPanel.types.boundary-event',
  'End Event': 'bpmnPanel.types.end-event',
}

/** 动画速度按钮 label → speed key */
const SPEED_LABEL_KEYS: Record<string, string> = {
  Slow: 'slow',
  Normal: 'normal',
  Fast: 'fast',
}

/** 翻译单个 key，未命中时返回 undefined */
function resolveKey(t: (key: string) => string, key: string): string | undefined {
  const value = t(key)
  return value && value !== key ? value : undefined
}

/** 翻译元素类型/流程兜底名 */
function translateName(name: string, t: (key: string) => string): string {
  const key = NAME_KEYS[name]
  if (key) {
    const translated = resolveKey(t, key)
    if (translated) return translated
  }
  return name
}

/** 翻译日志文本，处理 “{name} started/finished/canceled” 组合文案 */
function translateLogText(text: string, t: (key: string) => string): string {
  const match = text.match(/^(.*) (started|finished|canceled)$/)
  if (match) {
    const name = translateName(match[1] || '', t)
    const state = resolveKey(t, `bpmnPanel.tokenSimulation.${match[2]}`) || match[2] || ''
    return `${name} ${state}`.trim()
  }
  return translateName(text, t)
}

/** 翻译任意完整文案 */
function translateText(text: string, t: (key: string) => string): string {
  const exactKey = EXACT_MESSAGE_KEYS[text]
  if (exactKey) {
    const translated = resolveKey(t, exactKey)
    if (translated) return translated
  }
  return translateLogText(text, t)
}

/** 翻译标题，处理库内特殊模板（动画速度 / 聚焦流程实例） */
function translateTitleText(title: string, t: (key: string) => string): string {
  const speedPrefix = 'Set animation speed = '
  if (title.startsWith(speedPrefix)) {
    const label = title.slice(speedPrefix.length)
    const prefix =
      resolveKey(t, 'bpmnPanel.tokenSimulation.animationSpeedTitle') || speedPrefix.trim()
    const speedKey = SPEED_LABEL_KEYS[label]
    const translatedLabel = speedKey
      ? resolveKey(t, `bpmnPanel.tokenSimulation.speed.${speedKey}`) || label
      : label
    return `${prefix} = ${translatedLabel}`
  }

  const focusPrefix = 'Focus process instance '
  if (title.startsWith(focusPrefix)) {
    const scopeId = title.slice(focusPrefix.length)
    const prefix =
      resolveKey(t, 'bpmnPanel.tokenSimulation.focusProcessInstance') || focusPrefix.trim()
    return `${prefix} ${scopeId}`
  }

  return translateText(title, t)
}

/** 翻译元素的 title 属性，首次翻译时记录原始英文文案 */
function translateTitleAttr(el: HTMLElement, t: (key: string) => string): void {
  const src = el.getAttribute('data-camunda7-i18n-title') || el.getAttribute('title')
  if (!src) return
  const translated = translateTitleText(src, t)
  el.setAttribute('title', translated)
  if (!el.hasAttribute('data-camunda7-i18n-title')) {
    el.setAttribute('data-camunda7-i18n-title', src)
  }
}

/** 翻译 .bts-text 内容与 title */
function translateTextSpan(span: HTMLElement, t: (key: string) => string): void {
  const src = span.getAttribute('data-camunda7-i18n-text') || span.textContent || ''
  const translated = translateText(src, t)
  span.textContent = translated
  span.setAttribute('title', translated)
  span.setAttribute('data-camunda7-i18n-text', src)
}

/** 翻译日志面板：标题、关闭按钮、空状态占位 */
function patchLogPanel(logEl: HTMLElement, t: (key: string) => string): void {
  const header = logEl.querySelector('.bts-header')
  if (header) {
    const src = logEl.getAttribute('data-camunda7-i18n-header') || ''
    const textNode = Array.from(header.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim(),
    )
    if (textNode) {
      const source = src || (textNode.textContent || '').trim()
      textNode.textContent = translateText(source, t)
      logEl.setAttribute('data-camunda7-i18n-header', source)
    }
    const closeBtn = header.querySelector<HTMLElement>('.bts-close')
    if (closeBtn) {
      const srcLabel =
        closeBtn.getAttribute('data-camunda7-i18n-aria') || closeBtn.getAttribute('aria-label')
      if (srcLabel) {
        const translated = translateText(srcLabel, t)
        closeBtn.setAttribute('aria-label', translated)
        closeBtn.setAttribute('data-camunda7-i18n-aria', srcLabel)
      }
    }
  }
}

/** 翻译 .bts-entry（调色板/日志/占位）与 .bts-notification / .bts-element-notification 内容 */
function patchEntryContent(el: HTMLElement, t: (key: string) => string): void {
  const textSpan = el.querySelector('.bts-text')
  if (textSpan) {
    translateTextSpan(textSpan as HTMLElement, t)
    return
  }
  const textNode = Array.from(el.childNodes).find(
    (node) => node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim(),
  )
  if (textNode) {
    const src = el.getAttribute('data-camunda7-i18n-text') || (textNode.textContent || '').trim()
    textNode.textContent = translateText(src, t)
    el.setAttribute('data-camunda7-i18n-text', src)
  }
}

/** 翻译单个新增/存在的元素节点 */
function patchNode(node: Node, t: (key: string) => string): void {
  if (node.nodeType !== Node.ELEMENT_NODE) return
  const el = node as HTMLElement

  if (el.classList.contains('bts-log')) {
    patchLogPanel(el, t)
  } else if (el.classList.contains('bts-animation-speed-button')) {
    translateTitleAttr(el, t)
  } else if (el.classList.contains('bts-scope')) {
    translateTitleAttr(el, t)
  } else if (el.classList.contains('bts-context-pad')) {
    translateTitleAttr(el, t)
  } else if (
    el.classList.contains('bts-notification') ||
    el.classList.contains('bts-element-notification')
  ) {
    patchEntryContent(el, t)
  } else if (el.classList.contains('bts-entry')) {
    translateTitleAttr(el, t)
    patchEntryContent(el, t)
  }
}

export function useTokenSimulationI18n(
  options: UseTokenSimulationI18nOptions,
): UseTokenSimulationI18n {
  const { container, t } = options

  let observer: MutationObserver | null = null

  function patchAddedNode(node: Node): void {
    if (node.nodeType !== Node.ELEMENT_NODE) return
    patchNode(node, t)
    const descendants = (node as HTMLElement).querySelectorAll(WATCH_SELECTOR)
    descendants.forEach((descendant) => patchNode(descendant, t))
  }

  function setupObserver(): void {
    const host = container()
    if (!host || observer) return
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(patchAddedNode)
      }
    })
    observer.observe(host, { childList: true, subtree: true })
  }

  function reapply(): void {
    const host = container()
    if (!host) return
    host.querySelectorAll(WATCH_SELECTOR).forEach((el) => patchNode(el, t))
  }

  function dispose(): void {
    observer?.disconnect()
    observer = null
  }

  setupObserver()

  return {
    reapply,
    dispose,
  }
}
