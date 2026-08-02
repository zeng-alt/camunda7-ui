import { defineComponent, ref, watch, type PropType } from 'vue'
import { NButton, NInput, NSelect, NEmpty } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties } from '../../../composables'
import type { ExtraFieldTab } from '../base'

export const formTaskTabs: ExtraFieldTab[] = [
  { name: 'formTaskOperations', labelKey: 'bpmnPanel.tabs.formTaskOperations' },
]

export interface FormTaskOperationItem {
  _key: number
  fieldName: string
  op: 'add' | 'delete'
  value: string
}

/** 输入参数命名约定：formk:<op>:<字段名>，供后端 formkService 按前缀解析 */
const FORM_OPERATIONS_PREFIX = 'formk:'

let opKeySeq = 0

function createDefaultOperation(): FormTaskOperationItem {
  return { _key: opKeySeq++, fieldName: '', op: 'add', value: '' }
}

function findInputOutput(extensionElements: any): any {
  if (!extensionElements?.values) return null
  return extensionElements.values.find((v: any) => v.$type === 'camunda:InputOutput') || null
}

function parseParamName(
  name: string,
): { op: FormTaskOperationItem['op']; fieldName: string } | null {
  if (!name.startsWith(FORM_OPERATIONS_PREFIX)) return null
  const parts = name.split(':')
  const op = parts[1]
  if (op !== 'add' && op !== 'delete') return null
  return { op, fieldName: parts.slice(2).join(':') }
}

function buildParamName(op: string, fieldName: string): string {
  return `${FORM_OPERATIONS_PREFIX}${op}:${fieldName}`
}

export default defineComponent({
  name: 'FormTaskExtraFields',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 所属 tab 名称
    tabName: { type: String, default: 'formTaskOperations' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { getModdle, getOrCreateExtensionElements, updateProperties } = useBpmnProperties(props)
    const operations = ref<FormTaskOperationItem[]>([])
    const opOptions = [
      { label: t('bpmnPanel.formTask.opAdd'), value: 'add' },
      { label: t('bpmnPanel.formTask.opDelete'), value: 'delete' },
    ]

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) {
        operations.value = []
        return
      }
      const ee = bo.extensionElements
      const io = findInputOutput(ee)
      const raw: any[] = io ? io.inputParameters || [] : []
      operations.value = raw
        .map((p: any) => {
          const parsed = parseParamName(p.name || '')
          if (!parsed) return null
          return {
            _key: opKeySeq++,
            fieldName: parsed.fieldName,
            op: parsed.op,
            value: p.value ?? '',
          }
        })
        .filter((item: any): item is FormTaskOperationItem => item !== null)
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function save(list: FormTaskOperationItem[]) {
      const moddle = getModdle()
      const ee = getOrCreateExtensionElements()
      if (!moddle || !ee) return

      let io = findInputOutput(ee)
      if (!io) {
        io = moddle.create('camunda:InputOutput')
        ee.values.push(io)
      }

      const current = io.inputParameters || []
      const others = current.filter((p: any) => !parseParamName(p.name || ''))

      const params = list
        .filter((item) => item.fieldName)
        .map((item) =>
          moddle.create('camunda:InputParameter', {
            name: buildParamName(item.op, item.fieldName),
            ...(item.value ? { value: item.value } : {}),
          }),
        )

      io.inputParameters = [...others, ...params]
      updateProperties({ extensionElements: ee })
    }

    function add() {
      const next = [...operations.value, createDefaultOperation()]
      operations.value = next
      save(next)
    }

    function remove(index: number) {
      const next = operations.value.filter((_, i) => i !== index)
      operations.value = next
      save(next)
    }

    function update(index: number, field: keyof FormTaskOperationItem, val: any) {
      const next = operations.value.map((item, i) =>
        i === index ? { ...item, [field]: val } : item,
      )
      operations.value = next
      save(next)
    }

    return () => {
      if (props.tabName !== 'formTaskOperations') return null

      const items = operations.value

      return (
        <div>
          <div class="text-12px font-bold mb-8px">{t('bpmnPanel.formTask.title')}</div>
          {items.length === 0 ? (
            <div class="flex flex-col items-center gap-8px py-12px">
              <NEmpty description={t('bpmnPanel.panel.noFields')} size="small" />
              <NButton size="tiny" onClick={add} class="w-full justify-center">
                {t('bpmnPanel.formTask.addOperation')}
              </NButton>
            </div>
          ) : (
            <div class="flex flex-col gap-4px">
              {items.map((item, index) => (
                <div class="flex gap-4px items-center">
                  <NInput
                    value={item.fieldName}
                    onUpdateValue={(v: string | null) => update(index, 'fieldName', v ?? '')}
                    placeholder={t('bpmnPanel.formTask.placeholderFieldName')}
                    size={props.formSize}
                    style="flex:1"
                  />
                  <NSelect
                    value={item.op}
                    onUpdateValue={(v: string | null) => update(index, 'op', v ?? 'add')}
                    options={opOptions}
                    size={props.formSize}
                    style="width:110px"
                  />
                  <NInput
                    value={item.value}
                    onUpdateValue={(v: string | null) => update(index, 'value', v ?? '')}
                    placeholder={t('bpmnPanel.formTask.placeholderValue')}
                    size={props.formSize}
                    style="flex:1"
                  />
                  <NButton text type="error" size="tiny" onClick={() => remove(index)}>
                    {t('bpmnPanel.buttons.delete')}
                  </NButton>
                </div>
              ))}
              <NButton size="tiny" onClick={add} class="w-full justify-center">
                {t('bpmnPanel.formTask.addOperation')}
              </NButton>
            </div>
          )}
        </div>
      )
    }
  },
})
