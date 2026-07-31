import { toRaw } from 'vue'

export interface BpmnPropertyProps {
  bpmnModeler?: Record<string, any> | null
  element?: any
  businessObject?: any
}

export function useBpmnProperties(props: BpmnPropertyProps) {
  function getModdle() {
    return props.bpmnModeler?.get('moddle') ?? null
  }

  function getModeling() {
    return props.bpmnModeler?.get('modeling') ?? null
  }

  function updateProperties(attrs: Record<string, any>) {
    const modeling = getModeling()
    const element = toRaw(props.element)
    if (!modeling || !element) return
    modeling.updateProperties(element, attrs)
  }

  function updateProperty(key: string, value: any) {
    updateProperties({ [key]: value })
  }

  function updateModdleProperties(attrs: Record<string, any>, bo: any) {
    const modeling = getModeling()
    const element = toRaw(props.element)
    if (!modeling || !element || !bo) return
    modeling.updateModdleProperties(element, toRaw(bo), attrs)
  }

  function getOrCreateExtensionElements() {
    const bo = props.businessObject
    const moddle = getModdle()
    if (!bo || !moddle) return null
    if (!bo.extensionElements) {
      bo.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
    }
    return bo.extensionElements
  }

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
