import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NButton, NInput, NSelect, NEmpty } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { ScriptFields } from '.'

type AssignmentType = 'value' | 'list' | 'map' | 'script'

interface ListItem {
  _key: number
  value: string
}

interface MapEntry {
  _key: number
  key: string
  value: string
}

interface ParamItem {
  _key: number
  name: string
  assignmentType: AssignmentType
  value: string
  listItems: ListItem[]
  mapEntries: MapEntry[]
  scriptFormat: string
  scriptValue: string
}

let keySeq = 0

const assignmentTypeOptions = [
  { label: 'String / Expression', value: 'value' },
  { label: 'List', value: 'list' },
  { label: 'Map', value: 'map' },
  { label: 'Script', value: 'script' },
]

function findInputOutput(extensionElements: any): any {
  if (!extensionElements?.values) return null
  return extensionElements.values.find((v: any) => v.$type === 'camunda:InputOutput') || null
}

function createDefaultItem(): ParamItem {
  return {
    _key: keySeq++,
    name: '',
    assignmentType: 'value',
    value: '',
    listItems: [],
    mapEntries: [],
    scriptFormat: 'js',
    scriptValue: '',
  }
}

function createDefaultListItem(): ListItem {
  return { _key: keySeq++, value: '' }
}

function createDefaultMapEntry(): MapEntry {
  return { _key: keySeq++, key: '', value: '' }
}

export default defineComponent({
  name: 'IOAssignmentPanel',
  props: {
    businessObject: {
      type: Object as PropType<any>,
      default: null,
    },
    element: {
      type: Object as PropType<any>,
      default: null,
    },
    bpmnModeler: {
      type: Object,
      default: null,
    },
    formSize: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small',
    },
    direction: {
      type: String as PropType<'input' | 'output'>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const items = ref<ParamItem[]>([])

    const titleKey =
      props.direction === 'input' ? 'bpmnPanel.fields.inputs' : 'bpmnPanel.fields.outputs'
    const paramField = props.direction === 'input' ? 'inputParameters' : 'outputParameters'
    const paramType =
      props.direction === 'input' ? 'camunda:InputParameter' : 'camunda:OutputParameter'
    const addLabel =
      props.direction === 'input' ? 'bpmnPanel.buttons.addInput' : 'bpmnPanel.buttons.addOutput'

    function readParam(p: any): ParamItem {
      const definition = p.definition
      let assignmentType: AssignmentType = 'value'
      let value = ''
      let listItems: ListItem[] = []
      let mapEntries: MapEntry[] = []
      let scriptFormat = 'js'
      let scriptValue = ''

      if (!definition) {
        assignmentType = 'value'
        value = p.value ?? ''
      } else if (definition.$type === 'camunda:List') {
        assignmentType = 'list'
        const raw = Array.isArray(definition.items) ? definition.items : []
        listItems = raw.map((li: any) => ({
          _key: keySeq++,
          value: li.value ?? '',
        }))
      } else if (definition.$type === 'camunda:Map') {
        assignmentType = 'map'
        const raw = Array.isArray(definition.entries) ? definition.entries : []
        mapEntries = raw.map((me: any) => ({
          _key: keySeq++,
          key: me.key ?? '',
          value: me.value ?? '',
        }))
      } else if (definition.$type === 'camunda:Script') {
        assignmentType = 'script'
        scriptFormat = definition.scriptFormat ?? 'js'
        scriptValue = definition.value ?? ''
      }

      return {
        _key: keySeq++,
        name: p.name || '',
        assignmentType,
        value,
        listItems,
        mapEntries,
        scriptFormat,
        scriptValue,
      }
    }

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) {
        items.value = []
        return
      }
      const extensionElements = bo.extensionElements
      if (!extensionElements?.values) {
        items.value = []
        return
      }
      const io = findInputOutput(extensionElements)
      const raw = io ? io.get(paramField) : []
      const list: any[] = Array.isArray(raw) ? raw : []
      items.value = list.map(readParam)
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function save(itemList: ParamItem[]) {
      if (!props.bpmnModeler || !props.element) return
      const moddle = props.bpmnModeler.get('moddle')
      const modeling = props.bpmnModeler.get('modeling')
      const bo = props.businessObject
      if (!bo) return

      if (!bo.extensionElements) {
        bo.extensionElements = moddle.create('bpmn:ExtensionElements', {
          values: [],
        })
      }

      let io = findInputOutput(bo.extensionElements)
      if (!io) {
        io = moddle.create('camunda:InputOutput')
        bo.extensionElements.values.push(io)
      }

      io[paramField] = itemList.map((item) => {
        const attrs: Record<string, any> = { name: item.name }
        if (item.assignmentType === 'value') {
          if (item.value) attrs.value = item.value
        } else if (item.assignmentType === 'list') {
          const items = item.listItems
            .filter((li) => li.value)
            .map((li) => moddle.create('camunda:Value', { value: li.value }))
          if (items.length > 0) {
            attrs.definition = moddle.create('camunda:List', { items })
          }
        } else if (item.assignmentType === 'map') {
          const entries = item.mapEntries
            .filter((me) => me.key)
            .map((me) => moddle.create('camunda:Entry', { key: me.key, value: me.value }))
          if (entries.length > 0) {
            attrs.definition = moddle.create('camunda:Map', { entries })
          }
        } else if (item.assignmentType === 'script') {
          attrs.definition = moddle.create('camunda:Script', {
            scriptFormat: item.scriptFormat,
            value: item.scriptValue,
          })
        }
        return moddle.create(paramType, attrs)
      })

      modeling.updateProperties(toRaw(props.element), {
        extensionElements: bo.extensionElements,
      })
    }

    function add() {
      const next = [...items.value, createDefaultItem()]
      items.value = next
      save(next)
    }

    function remove(index: number) {
      const next = items.value.filter((_, i) => i !== index)
      items.value = next
      save(next)
    }

    function updateItem(index: number, field: string, val: any) {
      const next = items.value.map((item, i) => (i === index ? { ...item, [field]: val } : item))
      items.value = next
      save(next)
    }

    function addListItem(paramIndex: number) {
      const next = items.value.map((item, i) =>
        i === paramIndex
          ? { ...item, listItems: [...item.listItems, createDefaultListItem()] }
          : item,
      )
      items.value = next
      save(next)
    }

    function removeListItem(paramIndex: number, listIndex: number) {
      const next = items.value.map((item, i) =>
        i === paramIndex
          ? { ...item, listItems: item.listItems.filter((_, li) => li !== listIndex) }
          : item,
      )
      items.value = next
      save(next)
    }

    function updateListItem(paramIndex: number, listIndex: number, val: string) {
      const next = items.value.map((item, i) =>
        i === paramIndex
          ? {
              ...item,
              listItems: item.listItems.map((li, liIdx) =>
                liIdx === listIndex ? { ...li, value: val } : li,
              ),
            }
          : item,
      )
      items.value = next
      save(next)
    }

    function addMapEntry(paramIndex: number) {
      const next = items.value.map((item, i) =>
        i === paramIndex
          ? { ...item, mapEntries: [...item.mapEntries, createDefaultMapEntry()] }
          : item,
      )
      items.value = next
      save(next)
    }

    function removeMapEntry(paramIndex: number, entryIndex: number) {
      const next = items.value.map((item, i) =>
        i === paramIndex
          ? { ...item, mapEntries: item.mapEntries.filter((_, ei) => ei !== entryIndex) }
          : item,
      )
      items.value = next
      save(next)
    }

    function updateMapEntry(
      paramIndex: number,
      entryIndex: number,
      field: 'key' | 'value',
      val: string,
    ) {
      const next = items.value.map((item, i) =>
        i === paramIndex
          ? {
              ...item,
              mapEntries: item.mapEntries.map((me, mei) =>
                mei === entryIndex ? { ...me, [field]: val } : me,
              ),
            }
          : item,
      )
      items.value = next
      save(next)
    }

    return () => {
      if (!props.businessObject) return null

      return (
        <div>
          <div class="text-12px font-bold mb-8px">{t(titleKey)}</div>
          {items.value.length === 0 ? (
            <div class="flex flex-col items-center gap-12px py-24px">
              <NEmpty description={t('bpmnPanel.panel.noFields')} size="small" />
              <NButton size="tiny" onClick={add} class="w-full justify-center">
                {t(addLabel)}
              </NButton>
            </div>
          ) : (
            <div class="flex flex-col gap-8px">
              {items.value.map((item, index) => (
                <div class="flex flex-col gap-6px p-10px border border-solid border-light_border dark:border-dark_border rounded-4px bg-#fafafa dark:bg-#1a1a1a">
                  <div class="flex gap-8px items-center">
                    <NInput
                      value={item.name}
                      onUpdateValue={(v: string | null) => updateItem(index, 'name', v ?? '')}
                      placeholder={
                        props.direction === 'input'
                          ? t('bpmnPanel.placeholders.inputName')
                          : t('bpmnPanel.placeholders.outputName')
                      }
                      size={props.formSize}
                      style="flex:3;min-width:100px"
                    />
                    <NSelect
                      value={item.assignmentType}
                      onUpdateValue={(v: string | null) =>
                        updateItem(index, 'assignmentType', v ?? 'value')
                      }
                      options={assignmentTypeOptions}
                      size={props.formSize}
                      style="min-width:120px"
                    />
                    <NButton text type="error" size="tiny" onClick={() => remove(index)}>
                      {t('bpmnPanel.buttons.delete')}
                    </NButton>
                  </div>
                  {item.assignmentType === 'value' && (
                    <NInput
                      value={item.value}
                      onUpdateValue={(v: string | null) => updateItem(index, 'value', v ?? '')}
                      placeholder={t('bpmnPanel.placeholders.parameterValue')}
                      size={props.formSize}
                    />
                  )}
                  {item.assignmentType === 'list' && (
                    <div class="flex flex-col gap-4px pl-4px">
                      {item.listItems.map((li, liIdx) => (
                        <div class="flex gap-4px items-center">
                          <span class="text-12px text-#888 w-16px">{liIdx + 1}.</span>
                          <NInput
                            value={li.value}
                            onUpdateValue={(v: string | null) =>
                              updateListItem(index, liIdx, v ?? '')
                            }
                            placeholder={t('bpmnPanel.placeholders.parameterValue')}
                            size={props.formSize}
                            style="flex:1"
                          />
                          <NButton
                            text
                            type="error"
                            size="tiny"
                            onClick={() => removeListItem(index, liIdx)}
                          >
                            {t('bpmnPanel.buttons.delete')}
                          </NButton>
                        </div>
                      ))}
                      <NButton size="tiny" onClick={() => addListItem(index)}>
                        + {t('bpmnPanel.buttons.addItem')}
                      </NButton>
                    </div>
                  )}
                  {item.assignmentType === 'map' && (
                    <div class="flex flex-col gap-4px pl-4px">
                      {item.mapEntries.map((me, mei) => (
                        <div class="flex gap-4px items-center">
                          <NInput
                            value={me.key}
                            onUpdateValue={(v: string | null) =>
                              updateMapEntry(index, mei, 'key', v ?? '')
                            }
                            placeholder={t('bpmnPanel.placeholders.parameterKey')}
                            size={props.formSize}
                            style="flex:1"
                          />
                          <span class="text-12px text-#888">:</span>
                          <NInput
                            value={me.value}
                            onUpdateValue={(v: string | null) =>
                              updateMapEntry(index, mei, 'value', v ?? '')
                            }
                            placeholder={t('bpmnPanel.placeholders.parameterValue')}
                            size={props.formSize}
                            style="flex:1"
                          />
                          <NButton
                            text
                            type="error"
                            size="tiny"
                            onClick={() => removeMapEntry(index, mei)}
                          >
                            {t('bpmnPanel.buttons.delete')}
                          </NButton>
                        </div>
                      ))}
                      <NButton size="tiny" onClick={() => addMapEntry(index)}>
                        + {t('bpmnPanel.buttons.addEntry')}
                      </NButton>
                    </div>
                  )}
                  {item.assignmentType === 'script' && (
                    <ScriptFields
                      scriptFormat={item.scriptFormat}
                      scriptValue={item.scriptValue}
                      onUpdateScriptFormat={(v: string) => updateItem(index, 'scriptFormat', v)}
                      onUpdateScriptValue={(v: string) => updateItem(index, 'scriptValue', v)}
                      formSize={props.formSize}
                      compact
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          {items.value.length > 0 && (
            <div class="mt-8px">
              <NButton size="tiny" onClick={add} class="w-full justify-center">
                {t(addLabel)}
              </NButton>
            </div>
          )}
        </div>
      )
    }
  },
})
