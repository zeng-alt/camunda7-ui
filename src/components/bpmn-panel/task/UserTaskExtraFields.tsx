import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NInputNumber } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import type { ExtraFieldTab } from '../base'
import { UserPicker, GroupPicker, FormPanel } from '../base'

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

    function onAssigneeChange(val: string) {
      assignee.value = val
      updateProperty('assignee', val)
    }

    function onCandidateUsersChange(val: string) {
      candidateUsers.value = val
      updateProperty('candidateUsers', val)
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
            <UserPicker
              value={assignee.value}
              onUpdate:value={onAssigneeChange}
              multiple={false}
              formSize={props.formSize}
              label={t('bpmnPanel.fields.assignee')}
              placeholder={t('bpmnPanel.placeholders.assignee')}
            />
          </div>
          <div class="mt-12px">
            <UserPicker
              value={candidateUsers.value}
              onUpdate:value={onCandidateUsersChange}
              multiple
              formSize={props.formSize}
              label={t('bpmnPanel.fields.candidateUsers')}
              placeholder={t('bpmnPanel.placeholders.candidateUsers')}
            />
          </div>
          <div class="mt-12px">
            <GroupPicker
              value={candidateGroups.value}
              onUpdate:value={onCandidateGroupsChange}
              multiple
              formSize={props.formSize}
              label={t('bpmnPanel.fields.candidateGroups')}
              placeholder={t('bpmnPanel.placeholders.candidateGroups')}
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
