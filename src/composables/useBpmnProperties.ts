import { toRaw } from 'vue'

/** useBpmnProperties 所需的基础属性 */
export interface BpmnPropertyProps {
  /** bpmn-js 建模器实例 */
  bpmnModeler?: Record<string, any> | null
  /** BPMN 图形元素 */
  element?: any
  /** BPMN 业务对象 */
  businessObject?: any
}

/**
 * @description 封装 bpmn-js 建模器对 BPMN 元素属性的读写能力。
 *
 * 统一通过 `modeling.updateProperties` / `updateModdleProperties` 修改模型，
 * 自动 `toRaw` 处理响应式代理，避免直接操作 Vue 代理导致建模器异常。
 *
 * ## 基本用法
 *
 * ```ts
 * const { updateProperties, getOrCreateExtensionElements } = useBpmnProperties({
 *   bpmnModeler,
 *   element,
 *   businessObject,
 * })
 *
 * updateProperties({ name: '新名称' })
 * ```
 *
 * @param props 建模器 / 元素 / 业务对象
 * @returns 属性读写工具函数集合
 */
export function useBpmnProperties(props: BpmnPropertyProps) {
  function getModdle() {
    return props.bpmnModeler?.get('moddle') ?? null
  }

  function getModeling() {
    return props.bpmnModeler?.get('modeling') ?? null
  }

  /** 批量更新元素属性 */
  function updateProperties(attrs: Record<string, any>) {
    const modeling = getModeling()
    const element = toRaw(props.element)
    if (!modeling || !element) return
    modeling.updateProperties(element, attrs)
  }

  function updateProperty(key: string, value: any) {
    updateProperties({ [key]: value })
  }

  /** 更新指定业务对象的 moddle 属性 */
  function updateModdleProperties(attrs: Record<string, any>, bo: any) {
    const modeling = getModeling()
    const element = toRaw(props.element)
    if (!modeling || !element || !bo) return
    modeling.updateModdleProperties(element, toRaw(bo), attrs)
  }

  /** 获取扩展元素，不存在则创建 */
  function getOrCreateExtensionElements() {
    const bo = props.businessObject
    const moddle = getModdle()
    if (!bo || !moddle) return null
    if (!bo.extensionElements) {
      bo.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
    }
    return bo.extensionElements
  }

  /** 按类型查找扩展元素值 */
  function findExtensionValue($type: string) {
    const ee = props.businessObject?.extensionElements
    return ee?.values?.find((v: any) => v.$type === $type) ?? null
  }

  return {
    getModdle,
    getModeling,
    updateProperties,
    updateProperty,
    updateModdleProperties,
    getOrCreateExtensionElements,
    findExtensionValue,
  }
}
