import { defineComponent, computed, ref, watch, type PropType } from 'vue'
import { NTabPane } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { getTaskSubType } from '@/utils/bpmn'
import {
  InputsPanel,
  OutputsPanel,
  GeneralPanel,
  DocumentationPanel,
  ExtensionPropertiesPanel,
  ExecutionListenersPanel,
  AsyncCheckboxes,
  ConfigurableTabs,
} from '../base'
import UserTaskExtraFields, { userTaskTabs } from './UserTaskExtraFields'
import ServiceTaskExtraFields, { serviceTaskTabs } from './ServiceTaskExtraFields'
import SendTaskExtraFields, { sendTaskTabs } from './SendTaskExtraFields'
import ReceiveTaskExtraFields, { receiveTaskTabs } from './ReceiveTaskExtraFields'
import BusinessRuleTaskExtraFields, { businessRuleTaskTabs } from './BusinessRuleTaskExtraFields'
import ScriptTaskExtraFields, { scriptTaskTabs } from './ScriptTaskExtraFields'
import MultiInstanceFields from '../base/MultiInstanceFields'

export default defineComponent({
  name: 'TaskPropertiesPanel',
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
    // 自定义 Tab 内容渲染函数
    extraTabContent: {
      type: Function,
      default: null,
    },
    // 自定义 Tab 标签文本
    extraTabLabel: {
      type: String,
      default: '',
    },
    // 用户解析器表达式，用于解析办理人/候选人
    userResolver: {
      type: String,
      default: 'approverResolver.getUsers',
    },
    // 用户组解析器表达式，用于解析候选用户组
    groupResolver: {
      type: String,
      default: 'approverResolver.getUserGroups',
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const taskType = computed(() => getTaskSubType(props.businessObject))
    const tabValue = ref('general')

    watch(taskType, () => {
      tabValue.value = 'general'
    })

    return () => {
      const type = taskType.value

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
            {type === 'user-task' &&
              userTaskTabs.map((tab) => (
                <NTabPane name={tab.name} tab={t(tab.labelKey)}>
                  <UserTaskExtraFields
                    businessObject={props.businessObject}
                    element={props.element}
                    bpmnModeler={props.bpmnModeler}
                    formSize={props.formSize}
                    tabName={tab.name}
                    userResolver={props.userResolver}
                    groupResolver={props.groupResolver}
                  />
                </NTabPane>
              ))}

            {type === 'service-task' &&
              serviceTaskTabs.map((tab) => (
                <NTabPane name={tab.name} tab={t(tab.labelKey)}>
                  <ServiceTaskExtraFields
                    businessObject={props.businessObject}
                    element={props.element}
                    bpmnModeler={props.bpmnModeler}
                    formSize={props.formSize}
                    tabName={tab.name}
                  />
                </NTabPane>
              ))}
            {type === 'send-task' &&
              sendTaskTabs.map((tab) => (
                <NTabPane name={tab.name} tab={t(tab.labelKey)}>
                  <SendTaskExtraFields
                    businessObject={props.businessObject}
                    element={props.element}
                    bpmnModeler={props.bpmnModeler}
                    formSize={props.formSize}
                    tabName={tab.name}
                  />
                </NTabPane>
              ))}
            {type === 'receive-task' &&
              receiveTaskTabs.map((tab) => (
                <NTabPane name={tab.name} tab={t(tab.labelKey)}>
                  <ReceiveTaskExtraFields
                    businessObject={props.businessObject}
                    element={props.element}
                    bpmnModeler={props.bpmnModeler}
                    formSize={props.formSize}
                    tabName={tab.name}
                  />
                </NTabPane>
              ))}
            {type === 'script-task' &&
              scriptTaskTabs.map((tab) => (
                <NTabPane name={tab.name} tab={t(tab.labelKey)}>
                  <ScriptTaskExtraFields
                    businessObject={props.businessObject}
                    element={props.element}
                    bpmnModeler={props.bpmnModeler}
                    formSize={props.formSize}
                    tabName={tab.name}
                  />
                </NTabPane>
              ))}
            {type === 'business-rule-task' &&
              businessRuleTaskTabs.map((tab) => (
                <NTabPane name={tab.name} tab={t(tab.labelKey)}>
                  <BusinessRuleTaskExtraFields
                    businessObject={props.businessObject}
                    element={props.element}
                    bpmnModeler={props.bpmnModeler}
                    formSize={props.formSize}
                    tabName={tab.name}
                  />
                </NTabPane>
              ))}
            {type !== 'user-task' && (
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
            )}
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
            {props.extraTabContent && (
              <NTabPane name="custom" tab={props.extraTabLabel || t('bpmnPanel.tabs.custom')}>
                <div class="pt-8px">
                  {props.extraTabContent({
                    element: props.element,
                    businessObject: props.businessObject,
                    type,
                  })}
                </div>
              </NTabPane>
            )}
          </ConfigurableTabs>
        </div>
      )
    }
  },
})
