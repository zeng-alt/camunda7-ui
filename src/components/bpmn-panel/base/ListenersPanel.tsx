import { defineComponent, ref, watch, type PropType } from 'vue'
import { NButton, NInput, NSelect, NEmpty } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties } from '../../../composables'
import { ScriptFields, JavaClassField, ExpressionField, DelegateExpressionField } from '.'

export type ListenerKind = 'execution' | 'task'

interface FieldInjectionItem {
  _key: number
  name: string
  fieldType: 'string' | 'expression'
  value: string
}

interface ListenerItem {
  _key: number
  event: string
  listenerType: 'class' | 'expression' | 'delegateExpression' | 'script'
  klass: string
  expression: string
  delegateExpression: string
  scriptFormat: string
  scriptValue: string
  fields: FieldInjectionItem[]
}

let keySeq = 0

function eventOptionsFor(
  kind: ListenerKind,
  t: (key: string) => string,
): { label: string; value: string }[] {
  if (kind === 'task') {
    return [
      { label: t('bpmnPanel.fields.taskListenerCreate'), value: 'create' },
      { label: t('bpmnPanel.fields.taskListenerAssignment'), value: 'assignment' },
      { label: t('bpmnPanel.fields.taskListenerComplete'), value: 'complete' },
      { label: t('bpmnPanel.fields.taskListenerDelete'), value: 'delete' },
      { label: t('bpmnPanel.fields.taskListenerUpdate'), value: 'update' },
    ]
  }
  return [
    { label: 'Start', value: 'start' },
    { label: 'End', value: 'end' },
  ]
}

const listenerTypeOptions = [
  { label: 'Java Class', value: 'class' },
  { label: 'Expression', value: 'expression' },
  { label: 'Delegate Expression', value: 'delegateExpression' },
  { label: 'Script', value: 'script' },
]

const fieldTypeOptions = [
  { label: 'String', value: 'string' },
  { label: 'Expression', value: 'expression' },
]

function createDefaultItem(kind: ListenerKind): ListenerItem {
  return {
    _key: keySeq++,
    event: kind === 'task' ? 'create' : 'start',
    listenerType: 'class',
    klass: '',
    expression: '',
    delegateExpression: '',
    scriptFormat: 'js',
    scriptValue: '',
    fields: [],
  }
}

function createDefaultField(): FieldInjectionItem {
  return { _key: keySeq++, name: '', fieldType: 'string', value: '' }
}

export default defineComponent({
  name: 'ListenersPanel',
  props: {
    // 监听器类型：execution（执行）或 task（用户任务）
    kind: { type: String as PropType<ListenerKind>, required: true },
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: {
      type: Object as PropType<any>,
      default: null,
    },
    // 当前选中的 BPMN 图形元素
    element: {
      type: Object as PropType<any>,
      default: null,
    },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: {
      type: Object,
      default: null,
    },
    // 表单控件尺寸：small / medium / large
    formSize: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small',
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { getModdle, getOrCreateExtensionElements, updateProperties } = useBpmnProperties(props)
    const items = ref<ListenerItem[]>([])

    const elementType = props.kind === 'task' ? 'camunda:TaskListener' : 'camunda:ExecutionListener'

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
      const raw: any[] = extensionElements.values.filter((v: any) => v.$type === elementType)
      items.value = raw.map((p: any) => {
        let listenerType: ListenerItem['listenerType'] = 'class'
        if (p.class) listenerType = 'class'
        else if (p.expression) listenerType = 'expression'
        else if (p.delegateExpression) listenerType = 'delegateExpression'
        else if (p.script) listenerType = 'script'

        const script = p.script || {}
        const rawFields: any[] = Array.isArray(p.fields) ? p.fields : []

        return {
          _key: keySeq++,
          event: p.event || '',
          listenerType,
          klass: p.class || '',
          expression: p.expression || '',
          delegateExpression: p.delegateExpression || '',
          scriptFormat: script.scriptFormat || 'js',
          scriptValue: script.value || '',
          fields: rawFields.map((f: any) => ({
            _key: keySeq++,
            name: f.name || '',
            fieldType:
              f.string !== undefined || f.stringValue !== undefined ? 'string' : 'expression',
            value: f.string || f.stringValue || f.expression || '',
          })),
        }
      })
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function save(list: ListenerItem[]) {
      const moddle = getModdle()
      const ee = getOrCreateExtensionElements()
      if (!moddle || !ee) return

      const listeners = list.map((item) => {
        const attrs: Record<string, any> = { event: item.event }
        const fields = item.fields
          .filter((f) => f.name)
          .map((f) =>
            moddle.create('camunda:Field', {
              name: f.name,
              ...(f.fieldType === 'string' ? { string: f.value } : { expression: f.value }),
            }),
          )

        if (fields.length > 0) attrs.fields = fields

        if (item.listenerType === 'script') {
          attrs.script = moddle.create('camunda:Script', {
            scriptFormat: item.scriptFormat,
            value: item.scriptValue,
          })
        } else if (item.listenerType === 'class' && item.klass) {
          attrs['class'] = item.klass
        } else if (item.listenerType === 'expression' && item.expression) {
          attrs.expression = item.expression
        } else if (item.listenerType === 'delegateExpression' && item.delegateExpression) {
          attrs.delegateExpression = item.delegateExpression
        }

        return moddle.create(elementType, attrs)
      })

      const extValues = ee.get('values')
      const nonListeners = extValues.filter((v: any) => v.$type !== elementType)
      extValues.length = 0
      nonListeners.forEach((v: any) => extValues.push(v))
      listeners.forEach((v: any) => extValues.push(v))

      updateProperties({ extensionElements: ee })
    }

    function add() {
      const next = [...items.value, createDefaultItem(props.kind)]
      items.value = next
      save(next)
    }

    function remove(index: number) {
      const next = items.value.filter((_, i) => i !== index)
      items.value = next
      save(next)
    }

    function updateListener(index: number, field: string, val: any) {
      const next = items.value.map((item, i) => (i === index ? { ...item, [field]: val } : item))
      items.value = next
      save(next)
    }

    function addField(listenerIndex: number) {
      const next = items.value.map((item, i) =>
        i === listenerIndex ? { ...item, fields: [...item.fields, createDefaultField()] } : item,
      )
      items.value = next
      save(next)
    }

    function removeField(listenerIndex: number, fieldIndex: number) {
      const next = items.value.map((item, i) =>
        i === listenerIndex
          ? { ...item, fields: item.fields.filter((_, fi) => fi !== fieldIndex) }
          : item,
      )
      items.value = next
      save(next)
    }

    function updateField(listenerIndex: number, fieldIndex: number, field: string, val: any) {
      const next = items.value.map((item, i) =>
        i === listenerIndex
          ? {
              ...item,
              fields: item.fields.map((f, fi) => (fi === fieldIndex ? { ...f, [field]: val } : f)),
            }
          : item,
      )
      items.value = next
      save(next)
    }

    const eventLabel = t(
      props.kind === 'task'
        ? 'bpmnPanel.fields.taskListenerEvent'
        : 'bpmnPanel.fields.listenerEvent',
    )

    return () => {
      if (!props.businessObject) return null

      return (
        <div>
          {items.value.length === 0 ? (
            <div class="flex flex-col items-center gap-12px py-24px">
              <NEmpty description={t('bpmnPanel.panel.noFields')} size="small" />
              <NButton size="tiny" onClick={add} class="w-full justify-center">
                {t('bpmnPanel.buttons.addListener')}
              </NButton>
            </div>
          ) : (
            <div class="flex flex-col gap-8px">
              {items.value.map((item, index) => (
                <div class="flex flex-col gap-6px p-10px border border-solid border-light_border dark:border-dark_border rounded-4px bg-#fafafa dark:bg-#1a1a1a">
                  <div class="flex gap-8px items-center">
                    <NSelect
                      value={item.listenerType}
                      onUpdateValue={(v: string | null) =>
                        updateListener(index, 'listenerType', v ?? 'class')
                      }
                      options={listenerTypeOptions}
                      size={props.formSize}
                      style={props.kind === 'task' ? 'min-width:100px' : 'min-width:160px'}
                    />
                    <div class="text-12px text-#888">{eventLabel}:</div>
                    <NSelect
                      value={item.event}
                      onUpdateValue={(v: string | null) =>
                        updateListener(index, 'event', v ?? item.event)
                      }
                      options={eventOptionsFor(props.kind, t)}
                      size={props.formSize}
                      style={props.kind === 'task' ? 'width:200px' : 'width:100px'}
                    />
                    <div class="flex-1" />
                    <NButton text type="error" size="tiny" onClick={() => remove(index)}>
                      {t('bpmnPanel.buttons.delete')}
                    </NButton>
                  </div>

                  {item.listenerType === 'class' && (
                    <JavaClassField
                      value={item.klass}
                      onUpdateValue={(v: string) => updateListener(index, 'klass', v)}
                      formSize={props.formSize}
                    />
                  )}
                  {item.listenerType === 'expression' && (
                    <ExpressionField
                      value={item.expression}
                      onUpdateValue={(v: string) => updateListener(index, 'expression', v)}
                      formSize={props.formSize}
                    />
                  )}
                  {item.listenerType === 'delegateExpression' && (
                    <DelegateExpressionField
                      value={item.delegateExpression}
                      onUpdateValue={(v: string) => updateListener(index, 'delegateExpression', v)}
                      formSize={props.formSize}
                    />
                  )}
                  {item.listenerType === 'script' && (
                    <ScriptFields
                      scriptFormat={item.scriptFormat}
                      scriptValue={item.scriptValue}
                      onUpdateScriptFormat={(v: string) => updateListener(index, 'scriptFormat', v)}
                      onUpdateScriptValue={(v: string) => updateListener(index, 'scriptValue', v)}
                      formSize={props.formSize}
                      compact
                    />
                  )}

                  <div class="border-t border-dashed border-light_border dark:border-dark_border pt-6px mt-2px">
                    <div class="text-12px font-bold mb-4px">
                      {t('bpmnPanel.fields.fieldInjections')}
                    </div>
                    {item.fields.length === 0 ? (
                      <div class="flex flex-col items-center gap-8px py-12px">
                        <NEmpty description={t('bpmnPanel.panel.noFields')} size="small" />
                        <NButton
                          size="tiny"
                          onClick={() => addField(index)}
                          class="w-full justify-center"
                        >
                          {t('bpmnPanel.buttons.addField')}
                        </NButton>
                      </div>
                    ) : (
                      <div class="flex flex-col gap-4px">
                        {item.fields.map((field, fi) => (
                          <div class="flex gap-4px items-center">
                            <NInput
                              value={field.name}
                              onUpdateValue={(v: string | null) =>
                                updateField(index, fi, 'name', v ?? '')
                              }
                              placeholder={t('bpmnPanel.placeholders.fieldName')}
                              size={props.formSize}
                              style="flex:1"
                            />
                            <NSelect
                              value={field.fieldType}
                              onUpdateValue={(v: string | null) =>
                                updateField(index, fi, 'fieldType', v ?? 'string')
                              }
                              options={fieldTypeOptions}
                              size={props.formSize}
                              style="width:110px"
                            />
                            <NInput
                              value={field.value}
                              onUpdateValue={(v: string | null) =>
                                updateField(index, fi, 'value', v ?? '')
                              }
                              placeholder={t('bpmnPanel.placeholders.fieldValue')}
                              size={props.formSize}
                              style="flex:1"
                            />
                            <NButton
                              text
                              type="error"
                              size="tiny"
                              onClick={() => removeField(index, fi)}
                            >
                              {t('bpmnPanel.buttons.delete')}
                            </NButton>
                          </div>
                        ))}
                        <NButton
                          size="tiny"
                          onClick={() => addField(index)}
                          class="w-full justify-center"
                        >
                          {t('bpmnPanel.buttons.addField')}
                        </NButton>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {items.value.length > 0 && (
            <div class="mt-8px">
              <NButton size="tiny" onClick={add} class="w-full justify-center">
                {t('bpmnPanel.buttons.addListener')}
              </NButton>
            </div>
          )}
        </div>
      )
    }
  },
})
