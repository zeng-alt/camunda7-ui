import { defineComponent, computed, ref, type PropType } from 'vue'
import { NTabs, NTabPane } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { InputsPanel, OutputsPanel, GeneralPanel, DocumentationPanel, ExtensionPropertiesPanel, TaskListenersPanel, AsyncCheckboxes } from '../base'
import UserTaskExtraFields, { userTaskTabs } from './UserTaskExtraFields'

function getTaskSubType(businessObject: any): string {
  if (!businessObject) return ''
  const type: string = businessObject.$type || ''
  if (type.includes('UserTask')) return 'user-task'
  if (type.includes('ServiceTask')) return 'service-task'
  if (type.includes('ScriptTask')) return 'script-task'
  if (type.includes('BusinessRuleTask')) return 'business-rule-task'
  if (type.includes('CallActivity')) return 'call-activity'
  if (type.includes('Task')) return 'task'
  return ''
}

export default defineComponent({
  name: 'TaskPropertiesPanel',
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
    const taskType = computed(() => getTaskSubType(props.businessObject))
    const tabValue = ref('general')

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
            {type === 'user-task' && userTaskTabs.map(tab => (
              <NTabPane name={tab.name} tab={t(tab.labelKey)}>
                <UserTaskExtraFields
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                  tabName={tab.name}
                />
              </NTabPane>
            ))}
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
            <NTabPane name="taskListeners" tab={t('bpmnPanel.tabs.taskListeners')}>
              <div class="pt-8px">
                <TaskListenersPanel
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
