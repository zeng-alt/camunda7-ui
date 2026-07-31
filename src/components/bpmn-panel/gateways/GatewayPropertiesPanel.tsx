import { defineComponent, computed, ref, watch, toRaw, type PropType } from 'vue'
import { NTabs, NTabPane, NCheckbox } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { GeneralPanel, DocumentationPanel, ExtensionPropertiesPanel } from '../base'
import { AsyncCheckboxes, ExecutionListenersPanel } from '../base'

function getGatewaySubType(businessObject: any): string {
  if (!businessObject) return ''
  const type: string = businessObject.$type || ''
  if (type.includes('ExclusiveGateway')) return 'exclusive-gateway'
  if (type.includes('ParallelGateway')) return 'parallel-gateway'
  if (type.includes('ComplexGateway')) return 'complex-gateway'
  if (type.includes('Gateway')) return 'gateway'
  return ''
}

export default defineComponent({
  name: 'GatewayPropertiesPanel',
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
    const gatewayType = computed(() => getGatewaySubType(props.businessObject))
    const tabValue = ref('general')

    watch(
      () => props.businessObject,
      () => {
        tabValue.value = 'general'
      },
    )

    return () => {
      const type = gatewayType.value

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
            onUpdateValue={(v: string) => {
              tabValue.value = v
            }}
            size={props.formSize}
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
            {props.extraTabContent && (
              <NTabPane name="custom" tab={props.extraTabLabel || t('bpmnPanel.tabs.custom')}>
                <div class="pt-8px">
                  {props.extraTabContent({
                    element: props.element,
                    businessObject: props.businessObject,
                    type: gatewayType.value,
                  })}
                </div>
              </NTabPane>
            )}
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
