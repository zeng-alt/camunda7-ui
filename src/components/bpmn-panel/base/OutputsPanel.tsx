import { defineComponent, type PropType } from 'vue'
import IOAssignmentPanel from './IOAssignmentPanel'

export default defineComponent({
  name: 'OutputsPanel',
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
  },
  setup(props) {
    return () => (
      <IOAssignmentPanel
        businessObject={props.businessObject}
        element={props.element}
        bpmnModeler={props.bpmnModeler}
        formSize={props.formSize}
        direction="output"
      />
    )
  },
})
