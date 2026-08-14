import { defineComponent, ref, watch, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSize } from '../../../composables'
import type { ExtraFieldTab } from '../base'

export const transactionTabs: ExtraFieldTab[] = [
  { name: 'transaction', labelKey: 'bpmnPanel.tabs.transaction' },
]

export default defineComponent({
  name: 'TransactionExtraFields',
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
    tabName: { type: String, default: 'transaction' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)
    const { updateProperty } = useBpmnProperties(props)
    const method = ref('')
    const protocol = ref('')

    const methodOptions = [
      { label: t('bpmnPanel.options.transactionMethodNone'), value: '' },
      { label: 'requiresNew', value: 'requiresNew' },
      { label: 'requiresOwn', value: 'requiresOwn' },
      { label: 'requiresAll', value: 'requiresAll' },
    ]

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      method.value = bo.method || ''
      protocol.value = bo.protocol || ''
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onMethodChange(val: string | null) {
      method.value = val ?? ''
      updateProperty('method', val ?? '')
    }

    function onProtocolChange(val: string | null) {
      protocol.value = val ?? ''
      updateProperty('protocol', val ?? '')
    }

    return () => (
      <div class="pt-8px flex flex-col gap-12px">
        <div>
          <div class={`mb-4px ${labelClass.value}`}>{t('bpmnPanel.fields.transactionMethod')}</div>
          <NSelect
            value={method.value}
            onUpdateValue={onMethodChange}
            options={methodOptions}
            size={props.formSize}
            placeholder={t('bpmnPanel.fields.transactionMethod')}
          />
        </div>
        <div>
          <div class={`mb-4px ${labelClass.value}`}>
            {t('bpmnPanel.fields.transactionProtocol')}
          </div>
          <NInput
            value={protocol.value}
            onUpdateValue={onProtocolChange}
            placeholder={t('bpmnPanel.placeholders.transactionProtocol')}
            size={props.formSize}
          />
        </div>
      </div>
    )
  },
})
