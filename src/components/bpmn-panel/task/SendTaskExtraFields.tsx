import { defineComponent, type PropType } from 'vue'
import type { ExtraFieldTab } from '../base'
import { ImplementationExtraFields, FieldInjections } from '../base'

export const sendTaskTabs: ExtraFieldTab[] = [
  { name: 'implementation', labelKey: 'bpmnPanel.tabs.implementation' },
  { name: 'fieldInjections', labelKey: 'bpmnPanel.tabs.fieldInjections' },
]

export default defineComponent({
  name: 'SendTaskExtraFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    tabName: { type: String, default: 'implementation' },
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
          />
        )
      }
      if (props.tabName === 'fieldInjections') {
        return (
          <div class="pt-8px">
            <FieldInjections
              businessObject={props.businessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
            />
          </div>
        )
      }
      return null
    }
  },
})
