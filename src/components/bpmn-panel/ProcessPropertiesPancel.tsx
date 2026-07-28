import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NTabs, NTabPane, NInput, NCheckbox, NInputNumber } from 'naive-ui'
import { useCamundaI18n } from '../../locales'
import { GeneralPanel, DocumentationPanel, HintTooltip } from './base'

export default defineComponent({
  name: 'ProcessPropertiesPancel',
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
    const versionTag = ref('')
    const startableInTasklist = ref(false)
    const historyTimeToLive = ref('')
    const candidateStarterGroups = ref('')
    const candidateStarterUsers = ref('')
    const taskPriority = ref<number | null>(null)
    const jobPriority = ref<number | null>(null)
    const tabValue = ref('general')

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      versionTag.value = bo.versionTag || ''
      startableInTasklist.value = bo.startableInTasklist !== false
      historyTimeToLive.value = bo.historyTimeToLive || '180'
      candidateStarterGroups.value = bo.candidateStarterGroups || ''
      candidateStarterUsers.value = bo.candidateStarterUsers || ''
      taskPriority.value = bo.taskPriority ?? undefined
      jobPriority.value = bo.jobPriority ?? undefined
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function updateProperty(key: string, value: any) {
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { [key]: value })
    }

    function onVersionTagChange(val: string | null) {
      versionTag.value = val ?? ''
      updateProperty('versionTag', val ?? '')
    }

    function onStartableInTasklistChange(val: boolean) {
      startableInTasklist.value = val
      updateProperty('startableInTasklist', val)
    }

    function onHistoryTimeToLiveChange(val: string | null) {
      historyTimeToLive.value = val ?? ''
      updateProperty('historyTimeToLive', val ?? '')
    }

    function onCandidateStarterGroupsChange(val: string | null) {
      candidateStarterGroups.value = val ?? ''
      updateProperty('candidateStarterGroups', val ?? '')
    }

    function onCandidateStarterUsersChange(val: string | null) {
      candidateStarterUsers.value = val ?? ''
      updateProperty('candidateStarterUsers', val ?? '')
    }

    function onTaskPriorityChange(val: number | null) {
      taskPriority.value = val ?? null
      updateProperty('taskPriority', val ??  null)
    }

    function onJobPriorityChange(val: number | null) {
      jobPriority.value = val ?? null
      updateProperty('jobPriority', val ?? null)
    }

    return () => {
      if (!props.businessObject) {
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
                  showExecutable
                  formSize={props.formSize}
                  labelPlacement={props.labelPlacement}
                />
                <div class="mt-12px">
                  <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.versionTag')}</div>
                  <NInput
                    value={versionTag.value}
                    onUpdateValue={onVersionTagChange}
                    placeholder={t('bpmnPanel.placeholders.versionTag')}
                    size={props.formSize}
                  />
                </div>
                <div class="mt-12px">
                  <NCheckbox
                    checked={startableInTasklist.value}
                    onUpdateChecked={onStartableInTasklistChange}
                    size={props.formSize === 'small' ? 'small' : 'medium'}
                  >
                    {t('bpmnPanel.fields.startableInTasklist')}
                  </NCheckbox>
                </div>
                <div class="mt-12px">
                  <div class="mb-4px">
                    <HintTooltip
                      label={t('bpmnPanel.fields.historyTimeToLive')}
                      hintHtml={
                        'Number of days before this resource is being cleaned up. If specified, takes precedence over the engine configuration. <a href="https://docs.camunda.org/manual/latest/user-guide/process-engine/history/" target="_blank" rel="noopener noreferrer" style="color: #1890ff; text-decoration: underline;">Learn more</a>.'
                      }
                    />
                  </div>
                  <NInput
                    value={historyTimeToLive.value}
                    onUpdateValue={onHistoryTimeToLiveChange}
                    placeholder={t('bpmnPanel.placeholders.historyTimeToLive')}
                    size={props.formSize}
                  />
                </div>
                <div class="mt-12px">
                  <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.candidateStarterGroups')}</div>
                  <NInput
                    value={candidateStarterGroups.value}
                    onUpdateValue={onCandidateStarterGroupsChange}
                    placeholder={t('bpmnPanel.placeholders.candidateStarterGroups')}
                    size={props.formSize}
                  />
                </div>
                <div class="mt-12px">
                  <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.candidateStarterUsers')}</div>
                  <NInput
                    value={candidateStarterUsers.value}
                    onUpdateValue={onCandidateStarterUsersChange}
                    placeholder={t('bpmnPanel.placeholders.candidateStarterUsers')}
                    size={props.formSize}
                  />
                </div>
                <div class="mt-12px">
                  <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.taskPriority')}</div>
                  <NInputNumber
                    value={taskPriority.value}
                    onUpdateValue={onTaskPriorityChange}
                    placeholder={t('bpmnPanel.placeholders.taskPriority')}
                    size={props.formSize}
                    clearable
                  />
                </div>
                <div class="mt-12px">
                  <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.jobPriority')}</div>
                  <NInputNumber
                    value={jobPriority.value}
                    onUpdateValue={onJobPriorityChange}
                    placeholder={t('bpmnPanel.placeholders.jobPriority')}
                    size={props.formSize}
                    clearable
                  />
                </div>
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
