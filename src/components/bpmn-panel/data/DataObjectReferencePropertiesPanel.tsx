import { defineComponent, ref, watch, type PropType } from 'vue'
import { NTabPane } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import {
  GeneralPanel,
  DocumentationPanel,
  ExtensionPropertiesPanel,
  ConfigurableTabs,
} from '../base'

export default defineComponent({
  name: 'DataObjectReferencePropertiesPanel',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 标签位置：left（左侧）/ top（顶部）
    labelPlacement: { type: String as PropType<'left' | 'top'>, default: 'left' },
    // 元素的 modelerTemplate ID，由 CamundaPropertiesPanel 传入
    modelerTemplate: { type: String as PropType<string | null>, default: null },
    // 自定义 Tab 内容渲染函数
    extraTabContent: { type: Function, default: null },
    // 自定义 Tab 标签文本
    extraTabLabel: { type: String, default: '' },
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
        <ConfigurableTabs
          value={tabValue.value}
          onUpdateValue={(v: string) => {
            tabValue.value = v
          }}
          type="line"
          size={props.formSize}
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
              <div class="pt-8px">
                <DocumentationPanel
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                />
              </div>
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
          {props.extraTabContent && (
            <NTabPane name="custom" tab={props.extraTabLabel || t('bpmnPanel.tabs.custom')}>
              <div class="pt-8px">
                {props.extraTabContent({
                  element: props.element,
                  businessObject: props.businessObject,
                  type: 'data-object-reference',
                  modelerTemplate: props.modelerTemplate,
                })}
              </div>
            </NTabPane>
          )}
        </ConfigurableTabs>
      </div>
    )
  },
})
