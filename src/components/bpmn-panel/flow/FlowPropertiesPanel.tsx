import { defineComponent, computed, ref, watch, type PropType } from 'vue'
import { NTabPane } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { GeneralPanel, DocumentationPanel, ConfigurableTabs } from '../base'
import SequenceFlowExtraFields, { sequenceFlowTabs } from './SequenceFlowExtraFields'

function getFlowSubType(businessObject: any): string {
  if (!businessObject) return ''
  const type: string = businessObject.$type || ''
  if (type.includes('SequenceFlow')) return 'sequence-flow'
  return ''
}

export default defineComponent({
  name: 'FlowPropertiesPanel',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: {
      type: Object as PropType<any>,
      default: null,
    },
    // 当前选中的 BPMN 图形元素
    element: {
      type: Object as PropType<any>,
      default: null,
    },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: {
      type: Object,
      default: null,
    },
    // 表单控件尺寸：small / medium / large
    formSize: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small',
    },
    // 标签位置：left（左侧）/ top（顶部）
    labelPlacement: {
      type: String as PropType<'left' | 'top'>,
      default: 'left',
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const flowType = computed(() => getFlowSubType(props.businessObject))
    const tabValue = ref('general')

    watch(
      () => props.businessObject,
      () => {
        tabValue.value = 'general'
      },
    )

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
          <ConfigurableTabs
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
            {type === 'sequence-flow' &&
              sequenceFlowTabs.map((tab) => (
                <NTabPane name={tab.name} tab={t(tab.labelKey)}>
                  <SequenceFlowExtraFields
                    businessObject={props.businessObject}
                    element={props.element}
                    bpmnModeler={props.bpmnModeler}
                    formSize={props.formSize}
                    tabName={tab.name}
                  />
                </NTabPane>
              ))}
          </ConfigurableTabs>
        </div>
      )
    }
  },
})
