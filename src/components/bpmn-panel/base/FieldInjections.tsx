import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NButton, NInput, NSelect, NEmpty } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

export interface FieldItem {
  _key: number
  name: string
  fieldType: 'string' | 'expression'
  value: string
}

export const fieldTypeOptions = [
  { label: 'String', value: 'string' },
  { label: 'Expression', value: 'expression' },
]

let fieldKeySeq = 0

export function createDefaultField(): FieldItem {
  return { _key: fieldKeySeq++, name: '', fieldType: 'string', value: '' }
}

export default defineComponent({
  name: 'FieldInjections',
  props: {
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const localFields = ref<FieldItem[]>([])

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) {
        localFields.value = []
        return
      }
      const extValues = bo.extensionElements?.values
      if (!extValues) {
        localFields.value = []
        return
      }
      const raw: any[] = extValues.filter((v: any) => v.$type === 'camunda:Field')
      localFields.value = raw.map((f: any) => ({
        _key: 0,
        name: f.name || '',
        fieldType: f.string !== undefined || f.stringValue !== undefined ? 'string' : 'expression',
        value: f.string || f.stringValue || f.expression || '',
      }))
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function save() {
      if (!props.bpmnModeler || !props.element) return
      const modeling = (props.bpmnModeler as any).get('modeling')
      const moddle = (props.bpmnModeler as any).get('moddle')
      const bo = props.businessObject
      if (!bo) return

      if (!bo.extensionElements) {
        bo.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
      }

      const fieldModdles = localFields.value
        .filter((f) => f.name)
        .map((f) =>
          moddle.create('camunda:Field', {
            name: f.name,
            ...(f.fieldType === 'string' ? { string: f.value } : { expression: f.value }),
          }),
        )

      const extValues = bo.extensionElements.get('values')
      const nonFields = extValues.filter((v: any) => v.$type !== 'camunda:Field')
      extValues.length = 0
      nonFields.forEach((v: any) => extValues.push(v))
      fieldModdles.forEach((v: any) => extValues.push(v))

      modeling.updateProperties(toRaw(props.element), {
        extensionElements: bo.extensionElements,
      })
    }

    function add() {
      localFields.value = [...localFields.value, createDefaultField()]
      save()
    }

    function remove(index: number) {
      localFields.value = localFields.value.filter((_, i) => i !== index)
      save()
    }

    function update(index: number, field: string, val: any) {
      localFields.value = localFields.value.map((item, i) =>
        i === index ? { ...item, [field]: val } : item,
      )
      save()
    }

    return () => {
      const items = localFields.value

      return (
        <div>
          {items.length === 0 ? (
            <div class="flex flex-col items-center gap-8px py-12px">
              <NEmpty description={t('bpmnPanel.panel.noFields')} size="small" />
              <NButton size="tiny" onClick={add} class="w-full justify-center">
                {t('bpmnPanel.buttons.addField')}
              </NButton>
            </div>
          ) : (
            <div class="flex flex-col gap-4px">
              {items.map((field, fi) => (
                <div class="flex gap-4px items-center">
                  <NInput
                    value={field.name}
                    onUpdateValue={(v: string | null) => update(fi, 'name', v ?? '')}
                    placeholder={t('bpmnPanel.placeholders.fieldName')}
                    size={props.formSize}
                    style="flex:1"
                  />
                  <NSelect
                    value={field.fieldType}
                    onUpdateValue={(v: string | null) => update(fi, 'fieldType', v ?? 'string')}
                    options={fieldTypeOptions}
                    size={props.formSize}
                    style="width:110px"
                  />
                  <NInput
                    value={field.value}
                    onUpdateValue={(v: string | null) => update(fi, 'value', v ?? '')}
                    placeholder={t('bpmnPanel.placeholders.fieldValue')}
                    size={props.formSize}
                    style="flex:1"
                  />
                  <NButton text type="error" size="tiny" onClick={() => remove(fi)}>
                    {t('bpmnPanel.buttons.delete')}
                  </NButton>
                </div>
              ))}
              <NButton size="tiny" onClick={add} class="w-full justify-center">
                {t('bpmnPanel.buttons.addField')}
              </NButton>
            </div>
          )}
        </div>
      )
    }
  },
})
