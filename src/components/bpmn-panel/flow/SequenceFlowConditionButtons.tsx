import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NButton, NButtonGroup } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSize } from '../../../composables'

const AGREE_EXPRESSION = '${agree}'
const DISAGREE_EXPRESSION = '${!agree}'

function isDefaultFlow(sequenceFlow: any) {
  const source = sequenceFlow.source
  if (!source) return false
  const businessObject = source.businessObject
  return businessObject.default && businessObject.default.id === sequenceFlow.id
}

const flowButtonOptions = [
  { value: 'agree', labelKey: 'bpmnPanel.fields.flowAgree' },
  { value: 'disagree', labelKey: 'bpmnPanel.fields.flowDisagree' },
  { value: 'default', labelKey: 'bpmnPanel.fields.defaultFlow' },
]

export default defineComponent({
  name: 'SequenceFlowConditionButtons',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)
    const { getModeling, getModdle, updateProperties } = useBpmnProperties(props)
    const selected = ref<string | null>(null)

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo || !props.element) {
        selected.value = null
        return
      }
      if (isDefaultFlow(props.element)) {
        selected.value = 'default'
        return
      }
      const body = bo.conditionExpression?.body
      if (body === AGREE_EXPRESSION) selected.value = 'agree'
      else if (body === DISAGREE_EXPRESSION) selected.value = 'disagree'
      else selected.value = null
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onClick(val: string) {
      if (selected.value === val) {
        selected.value = null
        clearApplied()
      } else {
        selected.value = val
        apply(val)
      }
    }

    function clearApplied() {
      const element = toRaw(props.element)
      if (!element) return
      updateProperties({ conditionExpression: undefined })
      const modeling = getModeling()
      if (element.source?.businessObject?.default?.id === element.id && modeling) {
        modeling.updateProperties(element.source, { default: undefined })
      }
    }

    function apply(val: string) {
      const element = toRaw(props.element)
      if (!element) return
      const modeling = getModeling()
      const moddle = getModdle()
      if (!modeling || !moddle) return

      if (val === 'default') {
        updateProperties({ conditionExpression: undefined })
        if (element.source?.businessObject) {
          modeling.updateProperties(element.source, { default: toRaw(props.businessObject) })
        }
      } else {
        const body = val === 'agree' ? AGREE_EXPRESSION : DISAGREE_EXPRESSION
        const expr = moddle.create('bpmn:FormalExpression', { body })
        updateProperties({ conditionExpression: expr })
        if (element.source?.businessObject?.default?.id === element.id) {
          modeling.updateProperties(element.source, { default: undefined })
        }
      }
    }

    return () => (
      <div>
        <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.flowConfig')}</div>
        <NButtonGroup size={props.formSize}>
          {flowButtonOptions.map((option) => (
            <NButton
              key={option.value}
              type={selected.value === option.value ? 'primary' : 'default'}
              onClick={() => onClick(option.value)}
            >
              {t(option.labelKey)}
            </NButton>
          ))}
        </NButtonGroup>
      </div>
    )
  },
})
