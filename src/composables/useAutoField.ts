import { ref, computed, watch, type ComputedRef } from 'vue'
import { useBpmnProperties } from './useBpmnProperties'

/** useAutoField 的输入属性 */
export interface AutoFieldProps {
  /** 受控模式下外部传入的值 */
  value?: string
  /** 受控模式下值变化的回调 */
  onUpdateValue?: ((val: string) => void) | null
  /** BPMN 业务对象（自动模式下读写对象属性） */
  businessObject?: any
  /** BPMN 图形元素 */
  element?: any
  /** bpmn-js 建模器实例 */
  bpmnModeler?: any
  /** 自动模式下读写 businessObject 的属性键名 */
  propertyKey?: string
  /** 是否嵌套更新（走 updateModdleProperties） */
  nested?: boolean
}

/** useAutoField 的返回值 */
export interface UseAutoField {
  /** 自动模式下缓存的本地值 */
  local: ReturnType<typeof ref<string>>
  /** 实际展示值（自动模式取 local，否则取 value） */
  displayValue: ComputedRef<string>
  /** 是否为自动绑定模式（需同时提供 businessObject 与 propertyKey） */
  isAuto: () => boolean
  /** 从业务对象同步本地状态 */
  syncFromModel: () => void
  /** 值变化处理：自动模式写模型，受控模式回调 onUpdateValue */
  onChange: (val: string) => void
}

/**
 * @description 受控 / 自动绑定双模式字段逻辑。
 *
 * - **自动模式**：提供 `businessObject` + `propertyKey` 时，字段直接读写业务对象，
 *   通过 `useBpmnProperties` 写回建模器，并监听对象变化自动同步。
 * - **受控模式**：未提供上述属性时，回退到 `value` + `onUpdateValue` 的外部受控写法。
 *
 * ## 用法
 *
 * ```ts
 * const { displayValue, isAuto, syncFromModel, onChange } = useAutoField(props)
 * ```
 *
 * @param props 输入属性，见 {@link AutoFieldProps}
 * @returns 字段状态与处理方法，见 {@link UseAutoField}
 */
export function useAutoField(props: AutoFieldProps): UseAutoField {
  const local = ref('')

  const isAuto = () => !!props.businessObject && !!props.propertyKey

  const displayValue = computed(() => (isAuto() ? local.value : (props.value ?? '')))

  function syncFromModel() {
    const key = props.propertyKey
    if (!isAuto() || !key) return
    const bo = props.businessObject
    local.value = bo ? bo[key] || '' : ''
  }

  watch(() => props.businessObject, syncFromModel, { immediate: true })
  watch(() => props.element, syncFromModel, { immediate: true })

  const { updateProperties, updateModdleProperties } = useBpmnProperties(props as any)

  function onChange(val: string) {
    const key = props.propertyKey
    if (isAuto() && key) {
      local.value = val
      const attrs = { [key]: val || undefined }
      if (props.nested) {
        updateModdleProperties(attrs, props.businessObject)
      } else {
        updateProperties(attrs)
      }
    } else if (props.onUpdateValue) {
      props.onUpdateValue(val)
    }
  }

  return {
    local,
    displayValue,
    isAuto,
    syncFromModel,
    onChange,
  }
}
