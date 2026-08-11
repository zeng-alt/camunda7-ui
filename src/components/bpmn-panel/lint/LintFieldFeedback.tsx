import { defineComponent, type PropType } from 'vue'
import { useLintField, type LintFieldStatus } from '@/composables'

/**
 * 通用 Lint 字段反馈容器。
 *
 * 包裹任意输入组件，当对应字段存在 lint 问题时，在下方渲染
 * NaiveUI 风格的警告/错误提示文字（与 NFormItem feedback 一致）。
 */
export default defineComponent({
  name: 'LintFieldFeedback',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于匹配 lint 问题
    businessObject: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于读取 linting 服务
    bpmnModeler: { type: Object, default: null },
    // 字段路径（与 lint report 的 path 项一致），可传多个
    fieldPath: { type: [String, Array] as PropType<string | string[]>, default: null },
  },
  setup(props, { slots }) {
    const lint = useLintField(
      () => props.bpmnModeler as any,
      () => props.businessObject?.id,
      props.fieldPath as string | string[],
    )

    return () => {
      const fb: LintFieldStatus | null = lint.value
      return (
        <div>
          {slots.default?.()}
          {fb && (
            <div
              class={`mt-4px text-11px ${fb.status === 'error' ? 'text-#d03050' : 'text-#f0a020'}`}
            >
              {fb.feedback}
            </div>
          )}
        </div>
      )
    }
  },
})
