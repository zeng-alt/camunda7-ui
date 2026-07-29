import { defineComponent, type PropType } from 'vue'
import { type ExtraFieldTab } from '../base'

export const subProcessTabs: ExtraFieldTab[] = []

export default defineComponent({
  name: 'SubProcessExtraFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    tabName: { type: String, default: 'subProcess' },
  },
  setup(props) {
    return () => {
      return null
    }
  },
})
