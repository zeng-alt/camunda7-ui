import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NCheckbox, NInputNumber } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { DocumentationPanel, GeneralPanel, HintTooltip } from '../base'

export default defineComponent({
  name: 'ProcessContent',
  props: {
    element: { type: Object as PropType<any>, default: null },
    processBobject: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    showBasic: { type: Boolean, default: true },
    labelPlacement: { type: String as PropType<'left' | 'top'>, default: 'top' },
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

    function syncFields() {
      const p = props.processBobject
      if (p) {
        versionTag.value = p.versionTag || ''
        startableInTasklist.value = p.startableInTasklist !== false
        historyTimeToLive.value = p.historyTimeToLive || '180'
        candidateStarterGroups.value = p.candidateStarterGroups || ''
        candidateStarterUsers.value = p.candidateStarterUsers || ''
        taskPriority.value = p.taskPriority ?? null
        jobPriority.value = p.jobPriority ?? null
      } else {
        versionTag.value = ''
        startableInTasklist.value = false
        historyTimeToLive.value = ''
        candidateStarterGroups.value = ''
        candidateStarterUsers.value = ''
        taskPriority.value = null
        jobPriority.value = null
      }
    }

    watch(() => props.processBobject, syncFields, { immediate: true, deep: true })

    function updateProp(key: string, value: any) {
      if (!props.bpmnModeler || !props.element || !props.processBobject) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateModdleProperties(toRaw(props.element), toRaw(props.processBobject), { [key]: value })
    }

    function onVersionTagChange(val: string | null) {
      versionTag.value = val ?? ''
      updateProp('versionTag', val ?? '')
    }

    function onStartableInTasklistChange(val: boolean) {
      startableInTasklist.value = val
      updateProp('startableInTasklist', val)
    }

    function onHistoryTimeToLiveChange(val: string | null) {
      historyTimeToLive.value = val ?? ''
      updateProp('historyTimeToLive', val ?? '')
    }

    function onCandidateStarterGroupsChange(val: string | null) {
      candidateStarterGroups.value = val ?? ''
      updateProp('candidateStarterGroups', val ?? '')
    }

    function onCandidateStarterUsersChange(val: string | null) {
      candidateStarterUsers.value = val ?? ''
      updateProp('candidateStarterUsers', val ?? '')
    }

    function onTaskPriorityChange(val: number | null) {
      taskPriority.value = val ?? null
      updateProp('taskPriority', val ?? null)
    }

    function onJobPriorityChange(val: number | null) {
      jobPriority.value = val ?? null
      updateProp('jobPriority', val ?? null)
    }

    return () => {
      if (!props.processBobject) return null

      return (
        <div class="flex flex-col gap-12px">
          {props.showBasic && (
            <>
              <GeneralPanel
                businessObject={props.processBobject}
                element={props.element}
                bpmnModeler={props.bpmnModeler}
                showExecutable
                formSize={props.formSize}
                labelPlacement={props.labelPlacement}
              />
            </>
          )}
          <div>
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.versionTag')}</div>
            <NInput
              value={versionTag.value}
              onUpdateValue={onVersionTagChange}
              placeholder={t('bpmnPanel.placeholders.versionTag')}
              size={props.formSize}
            />
          </div>
          <div>
            <NCheckbox
              checked={startableInTasklist.value}
              onUpdateChecked={onStartableInTasklistChange}
              size={props.formSize === 'small' ? 'small' : 'medium'}
            >
              {t('bpmnPanel.fields.startableInTasklist')}
            </NCheckbox>
          </div>
          <div>
            <div class="mb-4px">
              <HintTooltip
                label={t('bpmnPanel.fields.historyTimeToLive')}
                hintHtml={t('bpmnPanel.tooltips.historyTimeToLive')}
              />
            </div>
            <NInput
              value={historyTimeToLive.value}
              onUpdateValue={onHistoryTimeToLiveChange}
              placeholder={t('bpmnPanel.placeholders.historyTimeToLive')}
              size={props.formSize}
            />
          </div>
          <div>
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.candidateStarterGroups')}</div>
            <NInput
              value={candidateStarterGroups.value}
              onUpdateValue={onCandidateStarterGroupsChange}
              placeholder={t('bpmnPanel.placeholders.candidateStarterGroups')}
              size={props.formSize}
            />
          </div>
          <div>
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.candidateStarterUsers')}</div>
            <NInput
              value={candidateStarterUsers.value}
              onUpdateValue={onCandidateStarterUsersChange}
              placeholder={t('bpmnPanel.placeholders.candidateStarterUsers')}
              size={props.formSize}
            />
          </div>
          <div>
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.taskPriority')}</div>
            <NInputNumber
              value={taskPriority.value}
              onUpdateValue={onTaskPriorityChange}
              placeholder={t('bpmnPanel.placeholders.taskPriority')}
              size={props.formSize}
              clearable
            />
          </div>
          <div>
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.jobPriority')}</div>
            <NInputNumber
              value={jobPriority.value}
              onUpdateValue={onJobPriorityChange}
              placeholder={t('bpmnPanel.placeholders.jobPriority')}
              size={props.formSize}
              clearable
            />
          </div>
          <div>
            <DocumentationPanel
              businessObject={props.processBobject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
            />
          </div>
        </div>
      )
    }
  },
})
