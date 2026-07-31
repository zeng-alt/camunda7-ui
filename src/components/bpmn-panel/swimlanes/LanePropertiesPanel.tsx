import { defineComponent, ref, watch, type PropType } from 'vue'
import { NTabs, NTabPane } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { DocumentationPanel, GeneralPanel, ExtensionPropertiesPanel } from '../base'

export default defineComponent({
  name: 'LanePropertiesPanel',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    labelPlacement: { type: String as PropType<'left' | 'top'>, default: 'left' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const tabValue = ref('general')

    watch(
      () => props.businessObject,
      () => {
        tabValue.value = 'general'
      },
    )

    return () => (
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
  },
})
