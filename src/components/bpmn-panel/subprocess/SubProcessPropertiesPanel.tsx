import { defineComponent, computed, ref, watch, type PropType } from 'vue'
import { NTabs, NTabPane } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import {
  GeneralPanel,
  DocumentationPanel,
  ExtensionPropertiesPanel,
  ExecutionListenersPanel,
  AsyncCheckboxes,
  InputsPanel,
  OutputsPanel,
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
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    labelPlacement: { type: String as PropType<'left' | 'top'>, default: 'left' },
    userResolver: { type: String, default: 'approverResolver.getUsers' },
    groupResolver: { type: String, default: 'approverResolver.getUserGroups' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const subType = computed(() => getSubProcessSubType(props.businessObject))
    const tabValue = ref('general')

    watch(() => props.businessObject, () => {
      tabValue.value = 'general'
    })

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
            <NTabPane name="executionListeners" tab={t('bpmnPanel.tabs.input')}>
              <div class="pt-8px">
                <InputsPanel
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                />
              </div>
            </NTabPane>
            <NTabPane name="executionListeners" tab={t('bpmnPanel.tabs.output')}>
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
          </NTabs>
        </div>
      )
    }
  },
})
