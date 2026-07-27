import { defineComponent, computed, ref, type PropType } from 'vue'
import { NTabs, NTabPane } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { GeneralPanel, DocumentationPanel, ExtensionPropertiesPanel, ExecutionListenersPanel, AsyncCheckboxes } from '../base'
import StartEventExtraFields, { startEventTabs } from './StartEventExtraFields'

function getEventSubType(businessObject: any): string {
  if (!businessObject) return ''
  const type: string = businessObject.$type || ''
  if (type.includes('StartEvent')) return 'start-event'
  if (type.includes('EndEvent')) return 'end-event'
  if (type.includes('IntermediateThrowEvent')) return 'intermediate-throw-event'
  if (type.includes('IntermediateCatchEvent')) return 'intermediate-catch-event'
  if (type.includes('BoundaryEvent')) return 'boundary-event'
  return ''
}

export default defineComponent({
  name: 'EventPropertiesPanel',
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
    labelPlacement: {
      type: String as PropType<'left' | 'top'>,
      default: 'left',
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const eventType = computed(() => getEventSubType(props.businessObject))
    const tabValue = ref('general')

    return () => {
      const type = eventType.value

      if (!type) {
        return (
          <div class="flex items-center justify-center h-full text-#888 text-13px">
            <p>{t('bpmnPanel.panel.noProcess')}</p>
          </div>
        )
      }

      return (
        <div class="p-8px">
          <NTabs
            value={tabValue.value}
            onUpdateValue={(v: string) => { tabValue.value = v }}
            size="small"
            type="line"
          >
            <NTabPane name="general" tab={t('bpmnPanel.tabs.general')}>
              <div class="pt-8px">
                <GeneralPanel
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                  labelPlacement={props.labelPlacement}
                />
                <DocumentationPanel
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                />
                <AsyncCheckboxes
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                />
              </div>
            </NTabPane>
            {type === 'start-event' && startEventTabs.map(tab => (
              <NTabPane name={tab.name} tab={t(tab.labelKey)}>
                <StartEventExtraFields
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                  tabName={tab.name}
                />
              </NTabPane>
            ))}
            <NTabPane name="executionListeners" tab={t('bpmnPanel.tabs.executionListeners')}>
              <div class="pt-8px">
                <ExecutionListenersPanel
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                />
              </div>
            </NTabPane>
            <NTabPane name="extensionProperties" tab={t('bpmnPanel.tabs.extensionProperties')}>
              <div class="pt-8px">
                <ExtensionPropertiesPanel
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                />
              </div>
            </NTabPane>
          </NTabs>
        </div>
      )
    }
  },
})
