import { defineComponent, computed, ref, watch, type PropType } from 'vue'
import { NTabPane } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import {
  GeneralPanel,
  DocumentationPanel,
  ExtensionPropertiesPanel,
  ExecutionListenersPanel,
  AsyncCheckboxes,
  InputsPanel,
  OutputsPanel,
  ConfigurableTabs,
} from '../base'
import SubProcessExtraFields, { subProcessTabs } from './SubProcessExtraFields'
import MultiInstanceFields from '../base/MultiInstanceFields'
import AdHocSubProcessExtraFields, { adHocSubProcessTabs } from './AdHocSubProcessExtraFields'
import TransactionExtraFields, { transactionTabs } from './TransactionExtraFields'

function getSubProcessSubType(businessObject: any): string {
  if (!businessObject) return ''
  const type: string = businessObject.$type || ''
  if (type.includes('AdHocSubProcess')) return 'ad-hoc-sub-process'
  if (type.includes('SubProcess')) return 'sub-process'
  if (type.includes('Transaction')) return 'transaction'
  return ''
}

export default defineComponent({
  name: 'SubProcessPropertiesPanel',
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
    // 用户解析器表达式，用于解析办理人/候选人
    userResolver: { type: String, default: 'approverResolver.getUsers' },
    // 用户组解析器表达式，用于解析候选用户组
    groupResolver: { type: String, default: 'approverResolver.getUserGroups' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const subType = computed(() => getSubProcessSubType(props.businessObject))
    const tabValue = ref('general')

    watch(
      () => props.businessObject,
      () => {
        tabValue.value = 'general'
      },
    )

    return () => {
      const type = subType.value

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
            {type === 'sub-process' &&
              subProcessTabs.map((tab) => (
                <NTabPane name={tab.name} tab={t(tab.labelKey)}>
                  <SubProcessExtraFields
                    businessObject={props.businessObject}
                    element={props.element}
                    bpmnModeler={props.bpmnModeler}
                    formSize={props.formSize}
                    tabName={tab.name}
                  />
                </NTabPane>
              ))}
            {type === 'ad-hoc-sub-process' &&
              adHocSubProcessTabs.map((tab) => (
                <NTabPane name={tab.name} tab={t(tab.labelKey)}>
                  <AdHocSubProcessExtraFields
                    businessObject={props.businessObject}
                    element={props.element}
                    bpmnModeler={props.bpmnModeler}
                    formSize={props.formSize}
                    tabName={tab.name}
                  />
                </NTabPane>
              ))}
            {type === 'transaction' &&
              transactionTabs.map((tab) => (
                <NTabPane name={tab.name} tab={t(tab.labelKey)}>
                  <TransactionExtraFields
                    businessObject={props.businessObject}
                    element={props.element}
                    bpmnModeler={props.bpmnModeler}
                    formSize={props.formSize}
                    tabName={tab.name}
                  />
                </NTabPane>
              ))}
            <NTabPane name="multiInstance" tab={t('bpmnPanel.tabs.multiInstance')}>
              <div class="pt-8px">
                <MultiInstanceFields
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                  userResolver={props.userResolver}
                  groupResolver={props.groupResolver}
                />
              </div>
            </NTabPane>
            <NTabPane name="input" tab={t('bpmnPanel.tabs.input')}>
              <div class="pt-8px">
                <InputsPanel
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                />
              </div>
            </NTabPane>
            <NTabPane name="output" tab={t('bpmnPanel.tabs.output')}>
              <div class="pt-8px">
                <OutputsPanel
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                />
              </div>
            </NTabPane>
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
          </ConfigurableTabs>
        </div>
      )
    }
  },
})
