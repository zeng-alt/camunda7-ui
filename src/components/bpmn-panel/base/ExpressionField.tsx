import { defineComponent, type PropType } from 'vue'
import { NInput } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useAutoField } from '../../../composables/useAutoField'

import { useFormSize } from '../../../composables'

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
    const { labelClass } = useFormSize(() => props.formSize)
    const field = useAutoField(props)
    const resultField = useAutoField({
      value: props.resultVariable,
      onUpdateValue: props.onUpdateResultVariable,
      businessObject: props.businessObject,
      element: props.element,
      bpmnModeler: props.bpmnModeler,
      propertyKey: props.resultVariablePropertyKey,
      nested: props.nested,
    })

    return () => {
      const input = props.textarea ? (
        <NInput
          type="textarea"
          rows={3}
          value={field.displayValue.value}
          onUpdateValue={(v: string | null) => field.onChange(v ?? '')}
          placeholder={t('bpmnPanel.placeholders.conditionExpression')}
          size={props.formSize}
        />
      ) : (
        <NInput
          value={field.displayValue.value}
          onUpdateValue={(v: string | null) => field.onChange(v ?? '')}
          placeholder={t('bpmnPanel.placeholders.listenerExpression')}
          size={props.formSize}
        />
      )

      if (!props.showResultVariable) return input

      return (
        <div class="flex flex-col gap-8px">
          <div>
            <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.listenerExpression')}</div>
            {input}
          </div>
          <div>
            <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.resultVariable')}</div>
            <NInput
              value={resultField.displayValue.value}
              onUpdateValue={(v: string | null) => resultField.onChange(v ?? '')}
              size={props.formSize}
            />
          </div>
        </div>
      )
    }
  },
})
