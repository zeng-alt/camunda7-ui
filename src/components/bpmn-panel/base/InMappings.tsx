import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NButton, NInput, NSelect, NCheckbox, NEmpty } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

export interface InMappingItem {
  _key: number
  type: 'source' | 'sourceExpression'
  source: string
  sourceExpression: string
  target: string
  local: boolean
}

let keySeq = 0

function createItem(): InMappingItem {
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
  name: 'InMappings',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const items = ref<InMappingItem[]>([])

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) {
        items.value = []
        return
      }
      const extValues = bo.extensionElements?.values || []
      const inEls = extValues.filter((v: any) => v.$type === 'camunda:In' && !v.variables)
      items.value = inEls.map((el: any) => ({
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

    function save(itemList: InMappingItem[]) {
      if (!props.bpmnModeler || !props.element) return
      const moddle = props.bpmnModeler.get('moddle')
      const modeling = props.bpmnModeler.get('modeling')
      const bo = props.businessObject
      if (!bo) return

      if (!bo.extensionElements) {
        bo.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
      }

      const others = bo.extensionElements.values.filter(
        (v: any) => !(v.$type === 'camunda:In' && !v.variables),
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
        others.push(moddle.create('camunda:In', attrs))
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

    function updateItem(index: number, field: keyof InMappingItem, val: any) {
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
        <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.inMappings')}</div>
        {items.value.length === 0 ? (
          <div class="flex flex-col items-center gap-12px py-16px">
            <NEmpty description={t('bpmnPanel.panel.noFields')} size="small" />
            <NButton size="tiny" onClick={add} class="w-full justify-center">
              {t('bpmnPanel.buttons.addInMapping')}
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
                    ? t('bpmnPanel.fields.inMappingSource')
                    : t('bpmnPanel.fields.inMappingSourceExpression')}
                </div>
                {item.type === 'source' ? (
                  <NInput
                    value={item.source}
                    onUpdateValue={(v: string | null) => updateItem(index, 'source', v ?? '')}
                    placeholder={t('bpmnPanel.placeholders.inMappingSource')}
                    size={props.formSize}
                  />
                ) : (
                  <NInput
                    value={item.sourceExpression}
                    onUpdateValue={(v: string | null) =>
                      updateItem(index, 'sourceExpression', v ?? '')
                    }
                    placeholder={t('bpmnPanel.placeholders.inMappingSourceExpression')}
                    size={props.formSize}
                  />
                )}
                <div class="text-12px text-#666">{t('bpmnPanel.fields.inMappingTarget')}</div>
                <NInput
                  value={item.target}
                  onUpdateValue={(v: string | null) => updateItem(index, 'target', v ?? '')}
                  placeholder={t('bpmnPanel.placeholders.inMappingTarget')}
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
              {t('bpmnPanel.buttons.addInMapping')}
            </NButton>
          </div>
        )}
      </div>
    )
  },
})
