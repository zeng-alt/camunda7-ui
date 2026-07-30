import { defineComponent, computed, ref, watch, type PropType } from 'vue'
import { NTabs, NTabPane } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { GeneralPanel, DocumentationPanel } from '../base'
import SequenceFlowExtraFields from './SequenceFlowExtraFields'

function getFlowSubType(businessObject: any): string {
  if (!businessObject) return ''
  const type: string = businessObject.$type || ''
  if (type.includes('SequenceFlow')) return 'sequence-flow'
  return ''
}

export default defineComponent({
  name: 'FlowPropertiesPanel',
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
    const flowType = computed(() => getFlowSubType(props.businessObject))
    const tabValue = ref('general')

    watch(() => props.businessObject, () => {
      tabValue.value = 'general'
    })

    return () => {
      const type = flowType.value

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
              </div>
              <div class="pt-8px">
                <DocumentationPanel
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                />
              </div>
            </NTabPane>
            {type === 'sequence-flow' && (
              <SequenceFlowExtraFields
                businessObject={props.businessObject}
                element={props.element}
                bpmnModeler={props.bpmnModeler}
                formSize={props.formSize}
              />
            )}
          </NTabs>
        </div>
      )
    }
  },
})
