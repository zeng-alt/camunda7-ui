import { defineComponent, type PropType } from 'vue'
import { useCamundaI18n } from '../../../locales'
import { InputsPanel, OutputsPanel, type ExtraFieldTab } from '../base'
import EventDefinitionPanel from './EventDefinitionPanel'

export const intermediateCatchEventTabs: ExtraFieldTab[] = [
  { name: 'intermediateCatch', labelKey: 'bpmnPanel.tabs.intermediateCatch' },
  { name: 'inputs', labelKey: 'bpmnPanel.tabs.input' },
  { name: 'outputs', labelKey: 'bpmnPanel.tabs.output' },
]

export default defineComponent({
  name: 'IntermediateCatchEventExtraFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    tabName: { type: String, default: 'intermediateCatch' },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    return () => {
      if (props.tabName === 'intermediateCatch') {
        return (
          <div class="pt-8px">
            <div class="mb-8px text-12px text-#666">{t('bpmnPanel.fields.eventDefinition')}</div>
            <EventDefinitionPanel
              businessObject={props.businessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
              showVariableEvents
            />
          </div>
        )
      }

      if (props.tabName === 'inputs') {
        return (
          <div class="pt-8px">
            <InputsPanel
              businessObject={props.businessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
            />
          </div>
        )
      }

      if (props.tabName === 'outputs') {
        return (
          <div class="pt-8px">
            <OutputsPanel
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
