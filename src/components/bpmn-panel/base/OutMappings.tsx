import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NButton, NInput, NSelect, NCheckbox, NEmpty } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

export interface OutMappingItem {
  _key: number
  type: 'source' | 'sourceExpression'
  source: string
  sourceExpression: string
  target: string
  local: boolean
}

let keySeq = 0

function createItem(): OutMappingItem {
  return {
    _key: keySeq++,
    type: 'source',
    source: '',
    sourceExpression: '',
    target: '',
    local: false,
  }
}

const typeOptions = [
  { label: 'Source', value: 'source' },
  { label: 'Source Expression', value: 'sourceExpression' },
]

export default defineComponent({
  name: 'OutMappings',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const items = ref<OutMappingItem[]>([])

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) {
        items.value = []
        return
      }
      const extValues = bo.extensionElements?.values || []
      const outEls = extValues.filter((v: any) => v.$type === 'camunda:Out' && !v.variables)
      items.value = outEls.map((el: any) => ({
        _key: keySeq++,
        type: el.sourceExpression !== undefined ? 'sourceExpression' : 'source',
        source: el.source ?? '',
        sourceExpression: el.sourceExpression ?? '',
        target: el.target ?? '',
        local: el.local === true,
      }))
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true, deep: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function save(itemList: OutMappingItem[]) {
      if (!props.bpmnModeler || !props.element) return
      const moddle = props.bpmnModeler.get('moddle')
      const modeling = props.bpmnModeler.get('modeling')
      const bo = props.businessObject
      if (!bo) return

      if (!bo.extensionElements) {
        bo.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
      }

      const others = bo.extensionElements.values.filter(
        (v: any) => !(v.$type === 'camunda:Out' && !v.variables),
      )

      for (const item of itemList) {
        const attrs: Record<string, any> = {}
        if (item.target) attrs.target = item.target
        if (item.type === 'source') {
          attrs.source = item.source
        } else {
          attrs.sourceExpression = item.sourceExpression
        }
        if (item.local) attrs.local = true
        others.push(moddle.create('camunda:Out', attrs))
      }

      bo.extensionElements.values = others
      modeling.updateProperties(toRaw(props.element), {
        extensionElements: bo.extensionElements,
      })
    }

    function add() {
      const next = [...items.value, createItem()]
      items.value = next
      save(next)
    }

    function remove(index: number) {
      const next = items.value.filter((_, i) => i !== index)
      items.value = next
      save(next)
    }

    function updateItem(index: number, field: keyof OutMappingItem, val: any) {
      const next = items.value.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: val }
        if (field === 'type') {
          if (val === 'source') updated.sourceExpression = ''
          else updated.source = ''
        }
        return updated
      })
      items.value = next
      save(next)
    }

    return () => (
      <div>
        <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.outMappings')}</div>
        {items.value.length === 0 ? (
          <div class="flex flex-col items-center gap-12px py-16px">
            <NEmpty description={t('bpmnPanel.panel.noFields')} size="small" />
            <NButton size="tiny" onClick={add} class="w-full justify-center">
              {t('bpmnPanel.buttons.addOutMapping')}
            </NButton>
          </div>
        ) : (
          <div class="flex flex-col gap-8px">
            {items.value.map((item, index) => (
              <div class="flex flex-col gap-6px p-10px border border-solid border-light_border dark:border-dark_border rounded-4px bg-#fafafa dark:bg-#1a1a1a">
                <div class="flex gap-8px items-center">
                  <span class="text-12px font-bold">{item.target || index + 1}</span>
                  <NSelect
                    value={item.type}
                    onUpdateValue={(v: string | null) => updateItem(index, 'type', v ?? 'source')}
                    options={typeOptions}
                    size={props.formSize}
                    style="flex:1"
                  />
                  <NButton text type="error" size="tiny" onClick={() => remove(index)}>
                    {t('bpmnPanel.buttons.delete')}
                  </NButton>
                </div>
                <div class="text-12px text-#666">
                  {item.type === 'source'
                    ? t('bpmnPanel.fields.outMappingSource')
                    : t('bpmnPanel.fields.outMappingSourceExpression')}
                </div>
                {item.type === 'source' ? (
                  <NInput
                    value={item.source}
                    onUpdateValue={(v: string | null) => updateItem(index, 'source', v ?? '')}
                    placeholder={t('bpmnPanel.placeholders.outMappingSource')}
                    size={props.formSize}
                  />
                ) : (
                  <NInput
                    value={item.sourceExpression}
                    onUpdateValue={(v: string | null) =>
                      updateItem(index, 'sourceExpression', v ?? '')
                    }
                    placeholder={t('bpmnPanel.placeholders.outMappingSourceExpression')}
                    size={props.formSize}
                  />
                )}
                <div class="text-12px text-#666">{t('bpmnPanel.fields.outMappingTarget')}</div>
                <NInput
                  value={item.target}
                  onUpdateValue={(v: string | null) => updateItem(index, 'target', v ?? '')}
                  placeholder={t('bpmnPanel.placeholders.outMappingTarget')}
                  size={props.formSize}
                />
                <NCheckbox
                  checked={item.local}
                  onUpdateChecked={(v: boolean) => updateItem(index, 'local', v)}
                  size={props.formSize === 'small' ? 'small' : 'medium'}
                >
                  {t('bpmnPanel.fields.local')}
                </NCheckbox>
              </div>
            ))}
          </div>
        )}
        {items.value.length > 0 && (
          <div class="mt-8px">
            <NButton size="tiny" onClick={add} class="w-full justify-center">
              {t('bpmnPanel.buttons.addOutMapping')}
            </NButton>
          </div>
        )}
      </div>
    )
  },
})
