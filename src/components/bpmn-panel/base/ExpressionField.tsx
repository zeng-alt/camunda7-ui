import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

export default defineComponent({
  name: 'ExpressionField',
  props: {
    value: { type: String, default: '' },
    onUpdateValue: { type: Function as PropType<(val: string) => void>, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    textarea: { type: Boolean, default: false },
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    propertyKey: { type: String, default: '' },
    nested: { type: Boolean, default: false },
    showResultVariable: { type: Boolean, default: false },
    resultVariable: { type: String, default: '' },
    onUpdateResultVariable: { type: Function as PropType<(val: string) => void>, default: null },
    resultVariablePropertyKey: { type: String, default: '' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const local = ref('')
    const localResultVariable = ref('')

    const isAuto = () => props.businessObject && props.propertyKey
    const isResultVarAuto = () => props.businessObject && props.resultVariablePropertyKey

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      if (isAuto()) local.value = bo[props.propertyKey] || ''
      if (isResultVarAuto()) localResultVariable.value = bo[props.resultVariablePropertyKey] || ''
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function saveProp(key: string, val: string) {
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      const attrs = { [key]: val || undefined }
      if (props.nested) {
        modeling.updateModdleProperties(toRaw(props.element), toRaw(props.businessObject), attrs)
      } else {
        modeling.updateProperties(toRaw(props.element), attrs)
      }
    }

    function onChange(val: string) {
      if (isAuto()) {
        local.value = val
        saveProp(props.propertyKey, val)
      } else if (props.onUpdateValue) {
        props.onUpdateValue(val)
      }
    }

    function onResultVariableChange(val: string) {
      if (isResultVarAuto()) {
        localResultVariable.value = val
        saveProp(props.resultVariablePropertyKey, val)
      } else if (props.onUpdateResultVariable) {
        props.onUpdateResultVariable(val)
      }
    }

    return () => {
      const input = props.textarea ? (
        <NInput
          type="textarea"
          rows={3}
          value={isAuto() ? local.value : props.value}
          onUpdateValue={(v: string | null) => onChange(v ?? '')}
          placeholder={t('bpmnPanel.placeholders.conditionExpression')}
          size={props.formSize}
        />
      ) : (
        <NInput
          value={isAuto() ? local.value : props.value}
          onUpdateValue={(v: string | null) => onChange(v ?? '')}
          placeholder={t('bpmnPanel.placeholders.listenerExpression')}
          size={props.formSize}
        />
      )

      if (!props.showResultVariable) return input

      return (
        <div class="flex flex-col gap-8px">
          <div>
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.listenerExpression')}</div>
            {input}
          </div>
          <div>
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.resultVariable')}</div>
            <NInput
              value={isResultVarAuto() ? localResultVariable.value : props.resultVariable}
              onUpdateValue={(v: string | null) => onResultVariableChange(v ?? '')}
              size={props.formSize}
            />
          </div>
        </div>
      )
    }
  },
})
