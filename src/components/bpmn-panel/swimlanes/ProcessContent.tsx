import { defineComponent, ref, watch, type PropType } from 'vue'
import { NInput, NCheckbox, NInputNumber } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSize } from '../../../composables'
import {
  DocumentationPanel,
  GeneralPanel,
  HintTooltip,
  UserPicker,
  GroupPicker,
  GlobalFormPanel,
  type ExtraFieldTab,
} from '../base'

export const processTabs: ExtraFieldTab[] = [
  { name: 'process', labelKey: 'bpmnPanel.tabs.poolProcess' },
  { name: 'globalForm', labelKey: 'bpmnPanel.tabs.globalForm' },
]

export default defineComponent({
  name: 'ProcessContent',
  props: {
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // 流程业务对象（Process），用于读写流程属性
    processBusinessObject: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 是否显示基础信息面板
    showBasic: { type: Boolean, default: true },
    // 标签位置：left（左侧）/ top（顶部）
    labelPlacement: { type: String as PropType<'left' | 'top'>, default: 'top' },
    // 所属 tab 名称
    tabName: { type: String, default: 'process' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)
    const { updateProperties } = useBpmnProperties(props)
    const versionTag = ref('')
    const startableInTasklist = ref(false)
    const historyTimeToLive = ref('')
    const candidateStarterGroups = ref('')
    const candidateStarterUsers = ref('')
    const taskPriority = ref<number | null>(null)
    const jobPriority = ref<number | null>(null)

    let syncing = false

    function syncFields() {
      if (syncing) return
      const p = props.processBusinessObject
      if (p) {
        versionTag.value = p.versionTag || ''
        startableInTasklist.value = p.startableInTasklist !== false
        historyTimeToLive.value = p.historyTimeToLive || ''
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

    watch(() => props.processBusinessObject, syncFields, { immediate: true, deep: true })

    function updateProp(key: string, value: any) {
      syncing = true
      updateProperties({ [key]: value })
      syncing = false
    }

    function onVersionTagChange(val: string | null) {
      updateProp('versionTag', val ?? '')
      versionTag.value = val ?? ''
    }

    function onStartableInTasklistChange(val: boolean) {
      updateProp('startableInTasklist', val)
      startableInTasklist.value = val
    }

    function onHistoryTimeToLiveChange(val: string | null) {
      updateProp('historyTimeToLive', val ?? '')
      historyTimeToLive.value = val ?? ''
    }

    function onCandidateStarterGroupsChange(val: string | null) {
      updateProp('candidateStarterGroups', val ?? '')
      candidateStarterGroups.value = val ?? ''
    }

    function onCandidateStarterUsersChange(val: string) {
      updateProp('candidateStarterUsers', val)
      candidateStarterUsers.value = val
    }

    function onTaskPriorityChange(val: number | null) {
      taskPriority.value = val ?? null
      updateProp('taskPriority', val ?? null)
    }

    function onJobPriorityChange(val: number | null) {
      jobPriority.value = val ?? null
      updateProp('jobPriority', val ?? null)
    }

    function renderProcessFields() {
      return (
        <div class="flex flex-col gap-12px">
          {props.showBasic && (
            <>
              <GeneralPanel
                businessObject={props.processBusinessObject}
                element={props.element}
                bpmnModeler={props.bpmnModeler}
                showExecutable
                formSize={props.formSize}
                labelPlacement={props.labelPlacement}
              />
            </>
          )}
          <div>
            <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.versionTag')}</div>
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
            <GroupPicker
              value={candidateStarterGroups.value}
              onUpdate:value={onCandidateStarterGroupsChange}
              multiple
              formSize={props.formSize}
              label={t('bpmnPanel.fields.candidateStarterGroups')}
              placeholder={t('bpmnPanel.placeholders.candidateStarterGroups')}
            />
          </div>
          <div>
            <UserPicker
              value={candidateStarterUsers.value}
              onUpdate:value={onCandidateStarterUsersChange}
              multiple
              formSize={props.formSize}
              label={t('bpmnPanel.fields.candidateStarterUsers')}
              placeholder={t('bpmnPanel.placeholders.candidateStarterUsers')}
            />
          </div>
          <div>
            <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.taskPriority')}</div>
            <NInputNumber
              value={taskPriority.value}
              onUpdateValue={onTaskPriorityChange}
              placeholder={t('bpmnPanel.placeholders.taskPriority')}
              size={props.formSize}
              clearable
            />
          </div>
          <div>
            <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.jobPriority')}</div>
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
              businessObject={props.processBusinessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
            />
          </div>
        </div>
      )
    }

    return () => {
      if (!props.processBusinessObject) return null

      if (props.tabName === 'globalForm') {
        return (
          <div class="pt-8px">
            <GlobalFormPanel
              businessObject={props.processBusinessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
            />
          </div>
        )
      }

      return renderProcessFields()
    }
  },
})
