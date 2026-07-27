import { defineComponent, computed, ref, watch, toRaw, type PropType } from 'vue'
import { NTabs, NTabPane, NCheckbox } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { GeneralPanel, DocumentationPanel, ExtensionPropertiesPanel, TaskListenersPanel } from '../base'
import CallActivityExtraFields, { callActivityTabs } from './CallActivityExtraFields'

function getCallActivitySubType(businessObject: any): string {
  if (!businessObject) return ''
  const type: string = businessObject.$type || ''
  if (type.includes('CallActivity')) return 'call-activity'
  return ''
}

export default defineComponent({
  name: 'CallActivityPropertiesPanel',
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
    const taskType = computed(() => getCallActivitySubType(props.businessObject))
    const tabValue = ref('general')

    const asyncBefore = ref(false)
    const asyncAfter = ref(false)
    const exclusive = ref(false)

    function syncAsyncState() {
      const bo = props.businessObject
      if (!bo) return
      asyncBefore.value = bo.asyncBefore === true
      asyncAfter.value = bo.asyncAfter === true
      exclusive.value = bo.exclusive !== false
    }

    watch(() => props.businessObject, syncAsyncState, { immediate: true })
    watch(() => props.element, syncAsyncState, { immediate: true })

    function updateProperty(key: string, value: any) {
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { [key]: value })
    }

    function onAsyncBeforeChange(val: boolean) {
      asyncBefore.value = val
      updateProperty('asyncBefore', val)
    }

    function onAsyncAfterChange(val: boolean) {
      asyncAfter.value = val
      updateProperty('asyncAfter', val)
    }

    function onExclusiveChange(val: boolean) {
      exclusive.value = val
      updateProperty('exclusive', val)
    }

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
                <div class="mt-12px flex gap-16px">
                  <NCheckbox
                    checked={asyncBefore.value}
                    onUpdateChecked={onAsyncBeforeChange}
                    size={props.formSize === 'small' ? 'small' : 'medium'}
                  >
                    {t('bpmnPanel.fields.asyncBefore')}
                  </NCheckbox>
                  <NCheckbox
                    checked={asyncAfter.value}
                    onUpdateChecked={onAsyncAfterChange}
                    size={props.formSize === 'small' ? 'small' : 'medium'}
                  >
                    {t('bpmnPanel.fields.asyncAfter')}
                  </NCheckbox>
                  <NCheckbox
                    checked={exclusive.value}
                    onUpdateChecked={onExclusiveChange}
                    size={props.formSize === 'small' ? 'small' : 'medium'}
                  >
                    {t('bpmnPanel.fields.exclusive')}
                  </NCheckbox>
                </div>
              </div>
            </NTabPane>
            {type === 'call-activity' && callActivityTabs.map(tab => (
              <NTabPane name={tab.name} tab={t(tab.labelKey)}>
                <CallActivityExtraFields
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                />
              </NTabPane>
            ))}
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
            <NTabPane name="documentation" tab={t('bpmnPanel.tabs.documentation')}>
              <div class="pt-8px">
                <DocumentationPanel
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
