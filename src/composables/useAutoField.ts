import { ref, computed, watch, type ComputedRef } from 'vue'
import { useBpmnProperties } from './useBpmnProperties'

export interface AutoFieldProps {
  value?: string
  onUpdateValue?: ((val: string) => void) | null
  businessObject?: any
  element?: any
  bpmnModeler?: any
  propertyKey?: string
  nested?: boolean
}

export interface UseAutoField {
  local: ReturnType<typeof ref<string>>
  displayValue: ComputedRef<string>
  isAuto: () => boolean
  syncFromModel: () => void
  onChange: (val: string) => void
}

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
