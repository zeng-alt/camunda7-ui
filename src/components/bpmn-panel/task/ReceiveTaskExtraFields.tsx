import { defineComponent, type PropType } from 'vue'
import type { ExtraFieldTab } from '../base'
import { MessageDefinitionFields } from '../base'

export const receiveTaskTabs: ExtraFieldTab[] = [
  { name: 'receiveTask', labelKey: 'bpmnPanel.tabs.receiveTask' },
]

export default defineComponent({
  name: 'ReceiveTaskExtraFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    tabName: { type: String, default: 'receiveTask' },
  },
  setup(props) {
    return () => {
      if (props.tabName !== 'receiveTask') return null
      return (
        <div class="pt-8px">
          <MessageDefinitionFields
            businessObject={props.businessObject}
            element={props.element}
            bpmnModeler={props.bpmnModeler}
            formSize={props.formSize}
            messageRefKey="messageRef"
          />
        </div>
      )
    }
  },
})
