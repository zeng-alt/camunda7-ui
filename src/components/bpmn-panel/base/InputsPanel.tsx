import { defineComponent, type PropType } from 'vue'
import IOAssignmentPanel from './IOAssignmentPanel'

export default defineComponent({
  name: 'InputsPanel',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: {
      type: Object as PropType<any>,
      default: null,
    },
    // 当前选中的 BPMN 图形元素
    element: {
      type: Object as PropType<any>,
      default: null,
    },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: {
      type: Object,
      default: null,
    },
    // 表单控件尺寸：small / medium / large
    formSize: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small',
    },
  },
  setup(props) {
    return () => (
      <IOAssignmentPanel
        businessObject={props.businessObject}
        element={props.element}
        bpmnModeler={props.bpmnModeler}
        formSize={props.formSize}
        direction="input"
      />
    )
  },
})
