import { defineComponent, ref, watch, toRaw, computed, type PropType } from 'vue'
import { NInput } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useCamundaLookups } from '../../../composables'
import DelegateExpressionPicker from './DelegateExpressionPicker'

export default defineComponent({
  name: 'DelegateExpressionField',
  props: {
    // 当前值（受控模式由父级传入）
    value: { type: String, default: '' },
    // 值变更回调（受控模式）
    onUpdateValue: { type: Function as PropType<(val: string) => void>, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 读写属性的 key（业务对象属性名）
    propertyKey: { type: String, default: '' },
    // 是否为嵌套渲染（用于子流程等内部面板场景）
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
