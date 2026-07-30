import { defineComponent, computed, ref, watch, type PropType } from 'vue'
import { NTabs, NTabPane } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import {
  GeneralPanel,
  DocumentationPanel,
  ExtensionPropertiesPanel,
  ExecutionListenersPanel,
  AsyncCheckboxes,
} from '../base'
import StartEventExtraFields, { startEventTabs } from './StartEventExtraFields'
import IntermediateCatchEventExtraFields, {
  intermediateCatchEventTabs,
} from './IntermediateCatchEventExtraFields'
import IntermediateThrowEventExtraFields, {
  intermediateThrowEventTabs,
} from './IntermediateThrowEventExtraFields'
import BoundaryEventExtraFields, { boundaryEventTabs } from './BoundaryEventExtraFields'
import EndEventExtraFields, { endEventTabs } from './EndEventExtraFields'
import { getEventDefType } from './EventDefinitionPanel'

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

const extraFieldsMap: Record<
  string,
  { component: any; tabs: { name: string; labelKey: string }[] }
> = {
  'start-event': { component: StartEventExtraFields, tabs: startEventTabs },
  'intermediate-catch-event': {
    component: IntermediateCatchEventExtraFields,
    tabs: intermediateCatchEventTabs,
  },
  'intermediate-throw-event': {
    component: IntermediateThrowEventExtraFields,
    tabs: intermediateThrowEventTabs,
  },
  'boundary-event': { component: BoundaryEventExtraFields, tabs: boundaryEventTabs },
  'end-event': { component: EndEventExtraFields, tabs: endEventTabs },
}

export default defineComponent({
  name: 'EventPropertiesPanel',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    labelPlacement: { type: String as PropType<'left' | 'top'>, default: 'left' },
    extraTabContent: {
      type: Function,
      default: null,
    },
    extraTabLabel: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const eventType = computed(() => getEventSubType(props.businessObject))
    const tabValue = ref('general')

    watch(() => props.businessObject, () => {
      tabValue.value = 'general'
    })

    const defType = computed(() => getEventDefType(props.businessObject))

    return () => {
      const type = eventType.value
      const def = defType.value

      if (!type) {
        return (
          <div class="flex items-center justify-center h-full text-#888 text-13px">
            <p>{t('bpmnPanel.panel.noProcess')}</p>
          </div>
        )
      }

      const config = extraFieldsMap[type]!
      const tabs = config.tabs
      const extendedTabs = props.extraTabContent
        ? [...tabs, { name: 'custom', labelKey: '' }]
        : tabs

      return (
        <div class="p-8px">
          <NTabs
            value={tabValue.value}
            onUpdateValue={(v: string) => {
              tabValue.value = v
            }}
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
                  showJob={'Timer' === def}
                />
              </div>
            </NTabPane>
            {extendedTabs.map((tab) => (
              <NTabPane
                name={tab.name}
                tab={
                  tab.name === 'custom'
                    ? props.extraTabLabel || t('bpmnPanel.tabs.custom')
                    : t(tab.labelKey)
                }
              >
                <config.component
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                  tabName={tab.name}
                  extraTabContent={props.extraTabContent}
                  extraTabLabel={props.extraTabLabel}
                  elementType={def}
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
