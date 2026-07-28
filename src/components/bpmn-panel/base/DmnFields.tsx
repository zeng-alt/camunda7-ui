import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

const bindingOptions = [
  { label: 'deployment', value: 'deployment' },
  { label: 'latest', value: 'latest' },
  { label: 'version', value: 'version' },
]

export default defineComponent({
  name: 'DmnFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    showResultVariable: { type: Boolean, default: false },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const decisionRef = ref('')
    const decisionRefBinding = ref('deployment')
    const decisionRefVersion = ref('')
    const decisionRefTenantId = ref('')
    const resultVariable = ref('')

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
      if (!props.bpmnModeler || !props.element) return
      const modeling = (props.bpmnModeler as any).get('modeling')
      modeling.updateProperties(toRaw(props.element), { [key]: val || undefined })
    }

    function onDecisionRefChange(val: string | null) {
      decisionRef.value = val ?? ''
      save('decisionRef', val)
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
          <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.decisionRef')}</div>
          <NInput
            value={decisionRef.value}
            onUpdateValue={onDecisionRefChange}
            placeholder={t('bpmnPanel.placeholders.decisionRef')}
            size={props.formSize}
          />
        </div>
        <div class="mb-8px">
          <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.decisionRefBinding')}</div>
          <NSelect
            value={decisionRefBinding.value}
            onUpdateValue={onBindingChange}
            options={bindingOptions}
            size={props.formSize}
          />
        </div>
        {decisionRefBinding.value === 'version' && (
          <div class="mb-8px">
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.decisionRefVersion')}</div>
            <NInput
              value={decisionRefVersion.value}
              onUpdateValue={onVersionChange}
              placeholder={t('bpmnPanel.placeholders.decisionRefVersion')}
              size={props.formSize}
            />
          </div>
        )}
        <div class="mb-8px">
          <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.decisionRefTenantId')}</div>
          <NInput
            value={decisionRefTenantId.value}
            onUpdateValue={onTenantIdChange}
            placeholder={t('bpmnPanel.placeholders.decisionRefTenantId')}
            size={props.formSize}
          />
        </div>
        {props.showResultVariable && (
          <div class="mb-8px">
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.resultVariable')}</div>
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
