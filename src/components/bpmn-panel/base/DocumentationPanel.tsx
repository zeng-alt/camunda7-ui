import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NFormItem, NForm } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

export default defineComponent({
  name: 'DocumentationPanel',
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
    formSize: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small',
    },
    labelPlacement: {
      type: String as PropType<'left' | 'top'>,
      default: 'top',
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const documentation = ref('')

    watch(
      () => props.businessObject,
      (bo) => {
        if (!bo) return
        const docs = bo.documentation
        if (docs && docs.length > 0) {
          documentation.value = docs[0].text || ''
        } else {
          documentation.value = ''
        }
      },
      { immediate: true },
    )

    function updateDocumentation(val: string) {
      documentation.value = val
      if (!props.bpmnModeler || !props.element) return

      const modeling = props.bpmnModeler.get('modeling')
      const moddle = props.bpmnModeler.get('moddle')
      const bo = props.businessObject
      if (!bo) return

      const doc = val ? [moddle.create('bpmn:Documentation', { text: val })] : []

      modeling.updateProperties(toRaw(props.element), {
        documentation: doc,
      })
    }

    return () => {
      if (!props.businessObject) return null

      return (
        <div class="pt-8px">
          <NFormItem
            size={props.formSize}
            label-placement={props.labelPlacement}
            label={t('bpmnPanel.fields.documentation')}
          >
            <NInput
              value={documentation.value}
              onUpdateValue={updateDocumentation}
              type="textarea"
              placeholder={t('bpmnPanel.placeholders.documentation')}
              rows={4}
              clearable
            />
          </NFormItem>
        </div>
      )
    }
  },
})
