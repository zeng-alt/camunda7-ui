import { defineComponent, ref, watch, type PropType } from 'vue'
import { NButton, NInput, NScrollbar, NEmpty } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties } from '../../../composables'

interface PropItem {
  _key: number
  name: string
  value: string
}

let keySeq = 0

export default defineComponent({
  name: 'ExtensionPropertiesPanel',
  props: {
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
    const items = ref<PropItem[]>([])

    function findPropertiesContainer(extensionElements: any): any {
      if (!extensionElements?.values) return null
      return extensionElements.values.find((v: any) => v.$type === 'camunda:Properties') || null
    }

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) {
        items.value = []
        return
      }
      const container = findPropertiesContainer(bo.extensionElements)
      const raw: any[] = container?.values || []
      items.value = raw.map((p: any) => ({
        _key: keySeq++,
        name: p.name || '',
        value: p.value || '',
      }))
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function save(items: PropItem[]) {
      const moddle = getModdle()
      const ee = getOrCreateExtensionElements()
      if (!moddle || !ee) return

      let container = findPropertiesContainer(ee)
      if (!container) {
        container = moddle.create('camunda:Properties')
        ee.get('values').push(container)
      }

      const values = items.map((item) =>
        moddle.create('camunda:Property', { name: item.name, value: item.value }),
      )
      container.values = values

      updateProperties({ extensionElements: ee })
    }

    function add() {
      const next = [...items.value, { _key: keySeq++, name: '', value: '' }]
      items.value = next
      save(next)
    }

    function remove(index: number) {
      const next = items.value.filter((_, i) => i !== index)
      items.value = next
      save(next)
    }

    function update(index: number, field: 'name' | 'value', val: string) {
      const next = items.value.map((item, i) => (i === index ? { ...item, [field]: val } : item))
      items.value = next
      save(next)
    }

    return () => {
      if (!props.businessObject) return null

      return (
        <div>
          <div class="text-12px font-bold mb-8px">{t('bpmnPanel.fields.extensionProperties')}</div>
          {items.value.length === 0 ? (
            <div class="flex flex-col items-center gap-12px py-24px">
              <NEmpty description={t('bpmnPanel.panel.noFields')} size="small" />
              <NButton size="tiny" onClick={add} class="w-full justify-center">
                {t('bpmnPanel.buttons.addProperty')}
              </NButton>
            </div>
          ) : (
            <div class="flex flex-col gap-4px">
              {items.value.map((item, index) => (
                <div class="flex gap-4px items-center">
                  <NInput
                    value={item.name}
                    onUpdateValue={(v: string | null) => update(index, 'name', v ?? '')}
                    placeholder={t('bpmnPanel.placeholders.propertyName')}
                    size={props.formSize}
                    style="flex:3;min-width:100px"
                  />
                  <NInput
                    value={item.value}
                    onUpdateValue={(v: string | null) => update(index, 'value', v ?? '')}
                    placeholder={t('bpmnPanel.placeholders.propertyValue')}
                    size={props.formSize}
                    style="flex:3;min-width:100px"
                  />
                  <NButton text type="error" size="tiny" onClick={() => remove(index)}>
                    {t('bpmnPanel.buttons.delete')}
                  </NButton>
                </div>
              ))}
            </div>
          )}
          {items.value.length > 0 && (
            <div class="mt-8px">
              <NButton size="tiny" onClick={add} class="w-full justify-center">
                {t('bpmnPanel.buttons.addProperty')}
              </NButton>
            </div>
          )}
        </div>
      )
    }
  },
})
