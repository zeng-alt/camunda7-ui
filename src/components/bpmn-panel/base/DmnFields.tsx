import { defineComponent, ref, computed, watch, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSize } from '../../../composables'
import DecisionRefPicker from './DecisionRefPicker'
import type { ProcessLookupItem } from '../../../composables'

const bindingOptions = [
  { label: 'deployment', value: 'deployment' },
  { label: 'latest', value: 'latest' },
  { label: 'version', value: 'version' },
]

export default defineComponent({
  name: 'DmnFields',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 是否显示结果变量输入框
    showResultVariable: { type: Boolean, default: false },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)
    const { updateProperty } = useBpmnProperties(props)
    const decisionRef = ref('')
    const decisionRefBinding = ref('deployment')
    const decisionRefVersion = ref('')
    const decisionRefTenantId = ref('')
    const resultVariable = ref('')
    const selectedDecision = ref<ProcessLookupItem | null>(null)

    const versionOptions = computed(() =>
      (selectedDecision.value?.version || []).map((v) => ({ label: v, value: v })),
    )

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      decisionRef.value = bo.decisionRef || ''
      decisionRefBinding.value = bo.decisionRefBinding || 'deployment'
      decisionRefVersion.value = bo.decisionRefVersion || ''
      decisionRefTenantId.value = bo.decisionRefTenantId || ''
      resultVariable.value = bo.resultVariable || ''
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function save(key: string, val: any) {
      updateProperty(key, val || undefined)
    }

    function onDecisionRefChange(val: string | null) {
      decisionRef.value = val ?? ''
      save('decisionRef', val)
    }

    function onDecisionItemChange(item: ProcessLookupItem | null) {
      selectedDecision.value = item
      if (item && decisionRefBinding.value === 'version') {
        const versions = item.version || []
        if (versions.length > 0 && !versions.includes(decisionRefVersion.value)) {
          decisionRefVersion.value = versions[0] || ''
          save('decisionRefVersion', decisionRefVersion.value)
        }
      }
    }

    function onBindingChange(val: string) {
      decisionRefBinding.value = val
      save('decisionRefBinding', val)
      if (val !== 'version') {
        decisionRefVersion.value = ''
        save('decisionRefVersion', undefined)
      }
    }

    function onVersionChange(val: string | null) {
      decisionRefVersion.value = val ?? ''
      save('decisionRefVersion', val)
    }

    function onTenantIdChange(val: string | null) {
      decisionRefTenantId.value = val ?? ''
      save('decisionRefTenantId', val)
    }

    function onResultVariableChange(val: string | null) {
      resultVariable.value = val ?? ''
      save('resultVariable', val)
    }

    return () => (
      <div>
        <div class="mb-8px">
          <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.decisionRef')}</div>
          <DecisionRefPicker
            value={decisionRef.value}
            onUpdate:value={onDecisionRefChange}
            onUpdate:item={onDecisionItemChange}
            formSize={props.formSize}
          />
        </div>
        <div class="mb-8px">
          <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.decisionRefBinding')}</div>
          <NSelect
            value={decisionRefBinding.value}
            onUpdateValue={onBindingChange}
            options={bindingOptions}
            size={props.formSize}
          />
        </div>
        {decisionRefBinding.value === 'version' && (
          <div class="mb-8px">
            <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.decisionRefVersion')}</div>
            {versionOptions.value.length > 0 ? (
              <NSelect
                value={decisionRefVersion.value || null}
                onUpdateValue={onVersionChange}
                options={versionOptions.value}
                placeholder={t('bpmnPanel.placeholders.decisionRefVersion')}
                size={props.formSize}
                clearable
              />
            ) : (
              <NInput
                value={decisionRefVersion.value}
                onUpdateValue={onVersionChange}
                placeholder={t('bpmnPanel.placeholders.decisionRefVersion')}
                size={props.formSize}
              />
            )}
          </div>
        )}
        <div class="mb-8px">
          <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.decisionRefTenantId')}</div>
          <NInput
            value={decisionRefTenantId.value}
            onUpdateValue={onTenantIdChange}
            placeholder={t('bpmnPanel.placeholders.decisionRefTenantId')}
            size={props.formSize}
          />
        </div>
        {props.showResultVariable && (
          <div class="mb-8px">
            <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.resultVariable')}</div>
            <NInput
              value={resultVariable.value}
              onUpdateValue={onResultVariableChange}
              size={props.formSize}
            />
          </div>
        )}
      </div>
    )
  },
})
