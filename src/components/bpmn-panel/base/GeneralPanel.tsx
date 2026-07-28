import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NSwitch, NFormItem, NForm } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

export default defineComponent({
  name: 'GeneralPanel',
  props: {
    businessObject: {
      type: Object as PropType<any>,
      default: null,
    },
    element: {
      type: Object as PropType<any>,
      default: null,
    },
    bpmnModeler: {
      type: Object,
      default: null,
    },
    showExecutable: {
      type: Boolean,
      default: false,
    },
    formSize: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small',
    },
    labelPlacement: {
      type: String as PropType<'left' | 'top'>,
      default: 'top',
    },
    labelWidth: {
      type: Number,
      default: 80,
    }
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const name = ref('')
    const id = ref('')
    const isExecutable = ref(false)

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      name.value = bo.name || ''
      id.value = (bo.id || props.element?.id) ?? ''
      isExecutable.value = bo.isExecutable !== false
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function updateProperty(key: string, value: any) {
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { [key]: value })
    }

    function onNameChange(val: string | null) {
      name.value = val ?? ''
      updateProperty('name', val ?? '')
    }

    function onIdChange(val: string | null) {
      id.value = val ?? ''
      updateProperty('id', val ?? '')
    }

    function onExecutableChange(val: boolean) {
      isExecutable.value = val
      updateProperty('isExecutable', val)
    }

    return () => {
      if (!props.businessObject) return null

      return (
          <NForm size={props.formSize} label-placement={props.labelPlacement} label-align="left" label-width={props.labelWidth}>
            <NFormItem label={t('bpmnPanel.fields.id')} path="id">
              <NInput
                value={id.value}
                onUpdateValue={onIdChange}
                placeholder={t('bpmnPanel.placeholders.elementId')}
              />
            </NFormItem>
            <NFormItem label={t('bpmnPanel.fields.name')} path="name">
              <NInput
                value={name.value}
                onUpdateValue={onNameChange}
                placeholder={t('bpmnPanel.placeholders.elementName')}
              />
            </NFormItem>
            {props.showExecutable && (
              <NFormItem label={t('bpmnPanel.fields.executable')} path="isExecutable">
                <NSwitch value={isExecutable.value} onUpdateValue={onExecutableChange} />
              </NFormItem>
            )}
          </NForm>

      )
    }
  },
})
