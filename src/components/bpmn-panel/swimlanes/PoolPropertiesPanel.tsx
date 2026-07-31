import { defineComponent, ref, watch, type PropType } from 'vue'
import { NTabPane } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import {
  GeneralPanel,
  DocumentationPanel,
  ExtensionPropertiesPanel,
  ConfigurableTabs,
} from '../base'
import ProcessContent, { processTabs } from './ProcessContent'

const ProcessTabContent = defineComponent({
  name: 'PoolProcessTabContent',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 所属 tab 名称
    tabName: { type: String, default: 'process' },
  },
  setup(props) {
    return () => {
      const bo = props.businessObject?.processRef
      return (
        <div class="pt-8px">
          {bo && (
            <ProcessContent
              element={props.element}
              processBusinessObject={bo}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
              showBasic
              tabName={props.tabName}
            />
          )}
        </div>
      )
    }
  },
})

export default defineComponent({
  name: 'PoolPropertiesPanel',
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
          size={props.formSize}
          type="line"
        >
          <NTabPane name="general" tab={t('bpmnPanel.tabs.general')}>
            <div class="pt-8px">
              <GeneralPanel
                businessObject={props.businessObject}
                element={props.element}
                bpmnModeler={props.bpmnModeler}
                showExecutable
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

          {processTabs.map((tab) => (
            <NTabPane name={tab.name} tab={t(tab.labelKey)}>
              <ProcessTabContent {...props} tabName={tab.name} />
            </NTabPane>
          ))}

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
        </ConfigurableTabs>
      </div>
    )
  },
})
