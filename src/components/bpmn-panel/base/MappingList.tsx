import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NButton, NInput, NSelect, NCheckbox, NEmpty } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSize } from '../../../composables'

export type MappingDirection = 'in' | 'out'

export interface MappingItem {
  _key: number
  type: 'source' | 'sourceExpression'
  source: string
  sourceExpression: string
  target: string
  local: boolean
}

let keySeq = 0

function createItem(): MappingItem {
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

const config = {
  in: {
    elementType: 'camunda:In',
    heading: 'bpmnPanel.fields.inMappings',
    addButton: 'bpmnPanel.buttons.addInMapping',
    source: 'bpmnPanel.fields.inMappingSource',
    sourceExpression: 'bpmnPanel.fields.inMappingSourceExpression',
    sourcePlaceholder: 'bpmnPanel.placeholders.inMappingSource',
    sourceExpressionPlaceholder: 'bpmnPanel.placeholders.inMappingSourceExpression',
    target: 'bpmnPanel.fields.inMappingTarget',
    targetPlaceholder: 'bpmnPanel.placeholders.inMappingTarget',
  },
  out: {
    elementType: 'camunda:Out',
    heading: 'bpmnPanel.fields.outMappings',
    addButton: 'bpmnPanel.buttons.addOutMapping',
    source: 'bpmnPanel.fields.outMappingSource',
    sourceExpression: 'bpmnPanel.fields.outMappingSourceExpression',
    sourcePlaceholder: 'bpmnPanel.placeholders.outMappingSource',
    sourceExpressionPlaceholder: 'bpmnPanel.placeholders.outMappingSourceExpression',
    target: 'bpmnPanel.fields.outMappingTarget',
    targetPlaceholder: 'bpmnPanel.placeholders.outMappingTarget',
  },
} satisfies Record<MappingDirection, Record<string, string>>

export default defineComponent({
  name: 'MappingList',
  props: {
    // 输入（in）或输出（out）映射
    direction: { type: String as PropType<MappingDirection>, required: true },
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
    const { labelClass } = useFormSize(() => props.formSize)
    const { updateProperties, getOrCreateExtensionElements, getModdle } = useBpmnProperties(props)
    const items = ref<MappingItem[]>([])
    const cfg = config[props.direction]

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) {
        items.value = []
        return
      }
      const extValues = bo.extensionElements?.values || []
      const els = extValues.filter((v: any) => v.$type === cfg.elementType && !v.variables)
      items.value = els.map((el: any) => ({
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

    function save(itemList: MappingItem[]) {
      const moddle = getModdle()
      const ee = getOrCreateExtensionElements()
      if (!moddle || !ee) return

      const others = ee.values.filter((v: any) => !(v.$type === cfg.elementType && !v.variables))

      for (const item of itemList) {
        const attrs: Record<string, any> = {}
        if (item.target) attrs.target = item.target
        if (item.type === 'source') {
          attrs.source = item.source
        } else {
          attrs.sourceExpression = item.sourceExpression
        }
        if (item.local) attrs.local = true
        others.push(moddle.create(cfg.elementType, attrs))
      }

      ee.values = others
      updateProperties({ extensionElements: ee })
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

    function updateItem(index: number, field: keyof MappingItem, val: any) {
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
        <div class={`mb-4px ${labelClass}`}>{t(cfg.heading)}</div>
        {items.value.length === 0 ? (
          <div class="flex flex-col items-center gap-12px py-16px">
            <NEmpty description={t('bpmnPanel.panel.noFields')} size="small" />
            <NButton size="tiny" onClick={add} class="w-full justify-center">
              {t(cfg.addButton)}
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
                <div class={labelClass}>
                  {item.type === 'source' ? t(cfg.source) : t(cfg.sourceExpression)}
                </div>
                {item.type === 'source' ? (
                  <NInput
                    value={item.source}
                    onUpdateValue={(v: string | null) => updateItem(index, 'source', v ?? '')}
                    placeholder={t(cfg.sourcePlaceholder)}
                    size={props.formSize}
                  />
                ) : (
                  <NInput
                    value={item.sourceExpression}
                    onUpdateValue={(v: string | null) =>
                      updateItem(index, 'sourceExpression', v ?? '')
                    }
                    placeholder={t(cfg.sourceExpressionPlaceholder)}
                    size={props.formSize}
                  />
                )}
                <div class={labelClass}>{t(cfg.target)}</div>
                <NInput
                  value={item.target}
                  onUpdateValue={(v: string | null) => updateItem(index, 'target', v ?? '')}
                  placeholder={t(cfg.targetPlaceholder)}
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
              {t(cfg.addButton)}
            </NButton>
          </div>
        )}
      </div>
    )
  },
})
