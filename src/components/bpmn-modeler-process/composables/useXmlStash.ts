import { ref, onBeforeUnmount, type Ref } from 'vue'

/** useXmlStash 的配置选项 */
export interface UseXmlStashOptions {
  /** 是否启用自动暂存 */
  autoStash: boolean
  /** localStorage 暂存键名 */
  stashKey: string
  /** 判断是否存在外部传入的 XML（存在则跳过恢复） */
  hasExternalXml: () => boolean
  /** 保存当前 XML 的方法 */
  saveXml: () => Promise<string>
  /** 将 XML 加载到画布的方法 */
  loadDiagram: (xml: string) => Promise<void>
}

/** useXmlStash 的返回值：暂存状态与处理方法 */
export interface UseXmlStash {
  /** 是否显示恢复暂存对话框 */
  showRestoreDialog: Ref<boolean>
  /** 待恢复的暂存 XML */
  pendingStashXml: Ref<string>
  /** 2 秒防抖暂存（绑定到元素变更事件） */
  debounceStash: () => void
  /** 检查暂存数据，存在则弹出恢复对话框 */
  checkStash: () => void
  /** 恢复暂存的 XML 到画布 */
  handleRestoreStash: () => void
  /** 丢弃暂存数据 */
  handleDiscardStash: () => void
  /** 立即强制落盘（组件卸载前调用） */
  flushStash: () => void
}

/**
 * @description 将 BPMN XML 自动暂存到 localStorage，并在刷新后提示恢复。
 *
 * - 通过 `debounceStash` 防抖暂存（绑定到 `element.changed` / `commandStack.changed`）
 * - 挂载时 `checkStash` 检测遗留暂存，弹出恢复对话框
 * - 卸载前调用 `flushStash` 立即落盘，避免丢数据
 *
 * ## 基本用法
 *
 * ```ts
 * const { checkStash, debounceStash, flushStash } = useXmlStash({
 *   autoStash: true,
 *   stashKey: 'camunda7-ui:stash:xml',
 *   hasExternalXml: () => !!props.xml,
 *   saveXml,
 *   loadDiagram,
 * })
 * ```
 *
 * @param options 配置选项，见 {@link UseXmlStashOptions}
 * @returns 暂存状态与处理方法，见 {@link UseXmlStash}
 */
export function useXmlStash(options: UseXmlStashOptions): UseXmlStash {
  const showRestoreDialog = ref(false)
  const pendingStashXml = ref('')
  let stashTimer: ReturnType<typeof setTimeout> | null = null
  let latestXml = ''

  /** 保存当前 XML 到 localStorage（自动暂存时） */
  async function doStash() {
    if (!options.autoStash) return
    try {
      latestXml = await options.saveXml()
      try {
        localStorage.setItem(options.stashKey, latestXml)
      } catch {
        // storage full or unavailable
      }
    } catch {
      // ignore
    }
  }

  /** 2 秒防抖暂存 XML */
  function debounceStash() {
    if (!options.autoStash) return
    if (stashTimer) clearTimeout(stashTimer)
    stashTimer = setTimeout(doStash, 2000)
  }

  /** 检查是否有暂存数据，有则弹出恢复对话框 */
  function checkStash() {
    if (options.hasExternalXml() || !options.autoStash) return
    try {
      const stashed = localStorage.getItem(options.stashKey)
      if (stashed) {
        pendingStashXml.value = stashed
        showRestoreDialog.value = true
      }
    } catch {
      // ignore
    }
  }

  /** 恢复暂存的 XML 并加载到画布 */
  function handleRestoreStash() {
    showRestoreDialog.value = false
    if (pendingStashXml.value) {
      latestXml = pendingStashXml.value
      options.loadDiagram(pendingStashXml.value)
    }
    pendingStashXml.value = ''
  }

  /** 丢弃暂存数据 */
  function handleDiscardStash() {
    showRestoreDialog.value = false
    pendingStashXml.value = ''
  }

  /** 立即强制落盘暂存（组件卸载前调用） */
  function flushStash() {
    doStash()
    if (latestXml) {
      try {
        localStorage.setItem(options.stashKey, latestXml)
      } catch {
        // storage full or unavailable
      }
    }
  }

  onBeforeUnmount(() => {
    if (stashTimer) clearTimeout(stashTimer)
  })

  return {
    showRestoreDialog,
    pendingStashXml,
    debounceStash,
    checkStash,
    handleRestoreStash,
    handleDiscardStash,
    flushStash,
  }
}
