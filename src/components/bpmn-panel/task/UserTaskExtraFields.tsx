import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NInputNumber } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import type { ExtraFieldTab } from '../base'
import FormPanel from '../base/FormPanel'

export const userTaskTabs: ExtraFieldTab[] = [
  { name: 'userTask', labelKey: 'bpmnPanel.tabs.userTask' },
  { name: 'forms', labelKey: 'bpmnPanel.tabs.forms' },
]

export default defineComponent({
  name: 'UserTaskExtraFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    tabName: { type: String, default: 'userTask' },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    const assignee = ref('')
    const candidateUsers = ref('')
    const candidateGroups = ref('')
    const dueDate = ref('')
    const followUpDate = ref('')
    const priority = ref<number | null>(null)

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      assignee.value = bo.assignee || ''
      candidateUsers.value = bo.candidateUsers || ''
      candidateGroups.value = bo.candidateGroups || ''
      dueDate.value = bo.dueDate || ''
      followUpDate.value = bo.followUpDate || ''
      priority.value = bo.priority ?? null
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function updateProperty(key: string, value: any) {
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { [key]: value })
    }

    function onAssigneeChange(val: string | null) {
      assignee.value = val ?? ''
      updateProperty('assignee', val ?? '')
    }

    function onCandidateUsersChange(val: string | null) {
      candidateUsers.value = val ?? ''
      updateProperty('candidateUsers', val ?? '')
    }

    function onCandidateGroupsChange(val: string | null) {
      candidateGroups.value = val ?? ''
      updateProperty('candidateGroups', val ?? '')
    }

    function onDueDateChange(val: string | null) {
      dueDate.value = val ?? ''
      updateProperty('dueDate', val ?? '')
    }

    function onFollowUpDateChange(val: string | null) {
      followUpDate.value = val ?? ''
      updateProperty('followUpDate', val ?? '')
    }

    function onPriorityChange(val: number | null) {
      priority.value = val
      updateProperty('priority', val)
    }

    return () => {
      if (props.tabName === 'forms') {
        return (
          <div class="pt-8px">
            <FormPanel
              businessObject={props.businessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
            />
          </div>
        )
      }

      return (
        <div class="pt-8px">
          <div class="mt-12px">
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.assignee')}</div>
            <NInput
              value={assignee.value}
              onUpdateValue={onAssigneeChange}
              placeholder={t('bpmnPanel.placeholders.assignee')}
              size={props.formSize}
            />
          </div>
          <div class="mt-12px">
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.candidateUsers')}</div>
            <NInput
              value={candidateUsers.value}
              onUpdateValue={onCandidateUsersChange}
              placeholder={t('bpmnPanel.placeholders.candidateUsers')}
              size={props.formSize}
            />
          </div>
          <div class="mt-12px">
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.candidateGroups')}</div>
            <NInput
              value={candidateGroups.value}
              onUpdateValue={onCandidateGroupsChange}
              placeholder={t('bpmnPanel.placeholders.candidateGroups')}
              size={props.formSize}
            />
          </div>
          <div class="mt-12px">
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.dueDate')}</div>
            <NInput
              value={dueDate.value}
              onUpdateValue={onDueDateChange}
              placeholder={t('bpmnPanel.placeholders.dueDate')}
              size={props.formSize}
            />
          </div>
          <div class="mt-12px">
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.followUpDate')}</div>
            <NInput
              value={followUpDate.value}
              onUpdateValue={onFollowUpDateChange}
              placeholder={t('bpmnPanel.placeholders.followUpDate')}
              size={props.formSize}
            />
          </div>
          <div class="mt-12px">
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.priority')}</div>
            <NInputNumber
              value={priority.value}
              onUpdateValue={onPriorityChange}
              placeholder={t('bpmnPanel.placeholders.priority')}
              size={props.formSize}
              min={0}
              class="w-full"
            />
          </div>
        </div>
      )
    }
  },
})
