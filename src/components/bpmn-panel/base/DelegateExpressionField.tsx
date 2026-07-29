import { defineComponent, ref, watch, toRaw, computed, type PropType } from 'vue'
import { NInput } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useCamundaLookups } from '../../../composables'
import DelegateExpressionPicker from './DelegateExpressionPicker'

export default defineComponent({
  name: 'DelegateExpressionField',
  props: {
    value: { type: String, default: '' },
    onUpdateValue: { type: Function as PropType<(val: string) => void>, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    propertyKey: { type: String, default: '' },
    nested: { type: Boolean, default: false },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { lookups } = useCamundaLookups()
    const local = ref('')

    const hasSearchFn = computed(() => !!lookups.searchDelegateExpressions)
    const isAuto = () => props.businessObject && props.propertyKey

    function syncFromModel() {
      if (!isAuto()) return
      const bo = props.businessObject
      local.value = bo ? bo[props.propertyKey] || '' : ''
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onChange(val: string) {
      if (isAuto()) {
        local.value = val
        if (props.bpmnModeler && props.element) {
          const modeling = props.bpmnModeler.get('modeling')
          const attrs = { [props.propertyKey]: val || undefined }
          if (props.nested) {
            modeling.updateModdleProperties(
              toRaw(props.element),
              toRaw(props.businessObject),
              attrs,
            )
          } else {
            modeling.updateProperties(toRaw(props.element), attrs)
          }
        }
      } else if (props.onUpdateValue) {
        props.onUpdateValue(val)
      }
    }

    return () =>
      hasSearchFn.value ? (
        <DelegateExpressionPicker
          value={isAuto() ? local.value : props.value}
          onUpdate:value={onChange}
          formSize={props.formSize}
        />
      ) : (
        <NInput
          value={isAuto() ? local.value : props.value}
          onUpdateValue={(v: string | null) => onChange(v ?? '')}
          placeholder={t('bpmnPanel.placeholders.listenerDelegateExpression')}
          size={props.formSize}
        />
      )
  },
})
