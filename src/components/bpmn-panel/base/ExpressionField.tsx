import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

export default defineComponent({
  name: 'ExpressionField',
  props: {
    // 当前值（受控模式由父级传入）
    value: { type: String, default: '' },
    // 值变更回调（受控模式）
    onUpdateValue: { type: Function as PropType<(val: string) => void>, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 是否使用多行文本域
    textarea: { type: Boolean, default: false },
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
    // 是否显示结果变量输入框
    showResultVariable: { type: Boolean, default: false },
    // 结果变量名
    resultVariable: { type: String, default: '' },
    // 结果变量变更回调
    onUpdateResultVariable: { type: Function as PropType<(val: string) => void>, default: null },
    // 结果变量属性名（业务对象属性名）
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
