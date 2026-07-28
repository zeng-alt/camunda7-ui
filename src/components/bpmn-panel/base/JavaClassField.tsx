import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

export default defineComponent({
  name: 'JavaClassField',
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
    const local = ref('')

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
            modeling.updateModdleProperties(toRaw(props.element), toRaw(props.businessObject), attrs)
          } else {
            modeling.updateProperties(toRaw(props.element), attrs)
          }
        }
      } else if (props.onUpdateValue) {
        props.onUpdateValue(val)
      }
    }

    return () => (
      <NInput
        value={isAuto() ? local.value : props.value}
        onUpdateValue={(v: string | null) => onChange(v ?? '')}
        placeholder={t('bpmnPanel.placeholders.listenerClass')}
        size={props.formSize}
      />
    )
  },
})
