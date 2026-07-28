import { defineComponent, computed, type PropType } from 'vue'
import { useCamundaI18n } from '../../../locales'
import type { ExtraFieldTab } from '../base'
import { InputsPanel, InMappingPropagation, InMappings } from '../base'
import EventDefinitionPanel, { getEventDefType } from './EventDefinitionPanel'

export const endEventTabs: ExtraFieldTab[] = [
  { name: 'endEvent', labelKey: 'bpmnPanel.tabs.endEvent' },
  { name: 'inputs', labelKey: 'bpmnPanel.tabs.input' },
]

export default defineComponent({
  name: 'EndEventExtraFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    tabName: { type: String, default: 'endEvent' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const isSignal = computed(() => getEventDefType(props.businessObject) === 'Signal')

    return () => {
      if (props.tabName === 'endEvent') {
        return (
          <div class="pt-8px">
            <div class="mb-8px text-12px text-#666">{t('bpmnPanel.fields.eventDefinition')}</div>
            <EventDefinitionPanel
              businessObject={props.businessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
            />
            {isSignal.value && (
              <>
                <div class="mt-12px">
                  <InMappingPropagation
                    businessObject={props.businessObject}
                    element={props.element}
                    bpmnModeler={props.bpmnModeler}
                    formSize={props.formSize}
                  />
                </div>
                <div class="mt-8px">
                  <InMappings
                    businessObject={props.businessObject}
                    element={props.element}
                    bpmnModeler={props.bpmnModeler}
                    formSize={props.formSize}
                  />
                </div>
              </>
            )}
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
      return null
      
    }
  },
})
