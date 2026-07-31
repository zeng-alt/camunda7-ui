import type { FormFieldItem } from './FormFieldEditor'

export const GLOBAL_FORM_PREFIX = 'globalForm.'
export const USE_GLOBAL_FORM_KEY = 'useGlobalForm'

export type GlobalFormType = 'none' | 'camunda' | 'external' | 'generated'

export interface GlobalFormData {
  type: GlobalFormType
  formRef: string
  binding: string
  version: string
  formKey: string
  fields: FormFieldItem[]
}

let keySeq = 0

export function restoreGlobalFields(raw: any[]): FormFieldItem[] {
  return (raw || []).map((f: any) => ({
    ...f,
    _key: keySeq++,
    properties: (f.properties || []).map((p: any) => ({ ...p, _key: keySeq++ })),
    enumValues: (f.enumValues || []).map((v: any) => ({ ...v, _key: keySeq++ })),
    constraints: {
      required: false,
      readOnly: false,
      minLength: null,
      maxLength: null,
      min: null,
      max: null,
      validator: '',
      ...(f.constraints || {}),
    },
  }))
}

export function serializeGlobalFields(fields: FormFieldItem[]): string {
  return JSON.stringify(
    fields.map(({ _key, ...rest }) => ({
      ...rest,
      properties: rest.properties.map(({ _key: _p, ...pr }) => pr),
      enumValues: rest.enumValues.map(({ _key: _v, ...ev }) => ev),
    })),
  )
}

export function findPropertiesContainer(extensionElements: any): any {
  if (!extensionElements?.values) return null
  return extensionElements.values.find((v: any) => v.$type === 'camunda:Properties') || null
}

export function findProcessDefinition(bo: any): any {
  let cur = bo
  while (cur) {
    if (cur.$type === 'bpmn:Process') return cur
    cur = cur.$parent
  }
  return null
}

function readGlobalFormMap(processBo: any): Map<string, string> {
  const map = new Map<string, string>()
  if (!processBo) return map
  const container = findPropertiesContainer(processBo.extensionElements)
  if (!container?.values) return map
  for (const p of container.values) {
    if (p.name && p.name.startsWith(GLOBAL_FORM_PREFIX)) {
      map.set(p.name.slice(GLOBAL_FORM_PREFIX.length), p.value)
    }
  }
  return map
}

export function readGlobalForm(processBo: any): GlobalFormData {
  const map = readGlobalFormMap(processBo)
  let fields: FormFieldItem[] = []
  const raw = map.get('fields')
  if (raw) {
    try {
      fields = restoreGlobalFields(JSON.parse(raw))
    } catch {
      fields = []
    }
  }
  return {
    type: (map.get('type') as GlobalFormType) || 'none',
    formRef: map.get('formRef') || '',
    binding: map.get('binding') || 'deployment',
    version: map.get('version') || '',
    formKey: map.get('formKey') || '',
    fields,
  }
}

export function readUseGlobalForm(businessObject: any): boolean {
  if (!businessObject) return false
  const container = findPropertiesContainer(businessObject.extensionElements)
  if (!container?.values) return false
  const prop = container.values.find((p: any) => p.name === USE_GLOBAL_FORM_KEY)
  return prop?.value === 'true'
}

function ensureExtensionElements(bo: any, moddle: any): any {
  if (!bo.extensionElements || typeof bo.extensionElements.get !== 'function') {
    bo.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
  }
  return bo.extensionElements
}

export function writeGlobalForm(
  processBo: any,
  moddle: any,
  data: GlobalFormData,
): { extensionElements?: any } {
  if (!processBo || !moddle) return {}
  const ee = ensureExtensionElements(processBo, moddle)
  const container = findPropertiesContainer(ee)
  const others = (container?.values || []).filter(
    (p: any) => !p.name || !p.name.startsWith(GLOBAL_FORM_PREFIX),
  )
  const entries: [string, string][] = [
    ['type', data.type],
    ['formRef', data.formRef],
    ['binding', data.binding],
    ['version', data.version],
    ['formKey', data.formKey],
  ]
  if (data.type === 'generated') {
    entries.push(['fields', serializeGlobalFields(data.fields)])
  }
  const newProps = entries.map(([name, value]) =>
    moddle.create('camunda:Property', { name: GLOBAL_FORM_PREFIX + name, value }),
  )
  const props = others.concat(newProps)
  if (!container) {
    ee.values.push(moddle.create('camunda:Properties', { values: props }))
  } else {
    container.values = props
  }
  return { extensionElements: ee }
}

export function writeUseGlobalForm(businessObject: any, moddle: any, use: boolean) {
  if (!businessObject || !moddle) return null
  const ee = ensureExtensionElements(businessObject, moddle)
  const container = findPropertiesContainer(ee)
  const others = (container?.values || []).filter((p: any) => p.name !== USE_GLOBAL_FORM_KEY)
  if (use) {
    others.push(moddle.create('camunda:Property', { name: USE_GLOBAL_FORM_KEY, value: 'true' }))
  }
  if (!container) {
    ee.values.push(moddle.create('camunda:Properties', { values: others }))
  } else {
    container.values = others
  }
  return businessObject.extensionElements
}
