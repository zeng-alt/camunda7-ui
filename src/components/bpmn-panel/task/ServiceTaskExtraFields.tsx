import { defineComponent, type PropType } from 'vue'
import type { ExtraFieldTab } from '../base'
import { ImplementationExtraFields } from '../base'

export const serviceTaskTabs: ExtraFieldTab[] = [
  { name: 'implementation', labelKey: 'bpmnPanel.tabs.implementation' },
]

export default defineComponent({
  name: 'ServiceTaskExtraFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    tabName: { type: String, default: 'connector' },
  },
  setup(props) {
    return () => {
      if (props.tabName === 'implementation') {
        return (
          <ImplementationExtraFields
            businessObject={props.businessObject}
            element={props.element}
            bpmnModeler={props.bpmnModeler}
            formSize={props.formSize}
            tabName="implementation"
          />
        )
      }
      return null
    }
  },
})
