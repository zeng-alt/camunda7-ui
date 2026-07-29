import { defineComponent, computed, type PropType } from 'vue'
import { useCamundaI18n } from '../../../locales'
import {
  OutputsPanel,
  InputsPanel,
  InMappingPropagation,
  InMappings,
  type ExtraFieldTab,
} from '../base'
import EventDefinitionPanel, { getEventDefType } from './EventDefinitionPanel'

export const intermediateThrowEventTabs: ExtraFieldTab[] = [
  { name: 'intermediateThrow', labelKey: 'bpmnPanel.tabs.intermediateThrow' },
  { name: 'inputs', labelKey: 'bpmnPanel.tabs.input' },
  { name: 'outputs', labelKey: 'bpmnPanel.tabs.output' },
]

export default defineComponent({
  name: 'IntermediateThrowEventExtraFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    tabName: { type: String, default: 'intermediateThrow' },
    extraTabContent: { type: Function, default: null },
    extraTabLabel: { type: String, default: '' },
    elementType: { type: String, default: '' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const isSignal = computed(() => getEventDefType(props.businessObject) === 'Signal')

    return () => {
      if (props.tabName === 'custom') {
        return (
          <div class="pt-8px">
            {props.extraTabContent({
              element: props.element,
              businessObject: props.businessObject,
              type: props.elementType,
            })}
          </div>
        )
      }
      if (props.tabName === 'intermediateThrow') {
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
